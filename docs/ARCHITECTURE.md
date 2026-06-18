# Vivid — Architecture

How Vivid turns one sentence into a reliable, interactive, shareable explainer —
and why it doesn't break.

---

## The load-bearing insight

> **The AI never writes interactive code.**

We hand-built five polished, interactive React templates. The model only does
two things:

1. **Classify** the description into one of the five templates.
2. **Populate** a *typed config* that fills that template.

That config is validated against a Zod contract before anything renders. The
interactive surface is finite and hand-crafted, so there are **no generated
buttons to break** — the failure mode of "AI builds a UI" (broken state, dead
controls, layout chaos) is designed out. This is what makes generation reliable
enough to put in front of judges and strangers, and it's why we can pour craft
into a small, fixed set of components.

Everything else in the system protects that boundary.

---

## Request flow

```
Browser
  │  POST /api/generate { description }            (input capped at 2000 chars)
  ▼
/api/generate  (Node runtime)
  ├─ rate-limit (8/min per IP)         lib/rate-limit.ts
  ├─ classify + populate via LLM       lib/llm.ts  →  { template_id, config }
  │     provider auto-detected: groq | gemini | openrouter | anthropic
  ├─ validate against the contract     lib/schemas.ts (Zod discriminated union)
  │     + simulator identifier whitelist  lib/evaluate.ts
  │     retry ONCE on failure, else friendly 500
  ├─ persist { slug, description, template_id, config }   lib/db.ts
  └─ return { slug }                   → client routes to /v/{slug}
  ▼
/v/[slug]  (Server Component — SSR)
  ├─ getExplainer(slug) + getPulse(slug)            lib/db.ts
  ├─ <TemplateRenderer/>   (Client) switches on template_id → 1 of 5 templates
  ├─ source description · ShareBar · PulseBar · Coach (ImproveButton)
  └─ generateMetadata → OG image /api/og/[slug]?title&tpl   (Edge, 1200×630)
```

Funnel events stream from the client through `lib/analytics.ts` to Novus **and**
to `/api/track`, which aggregates a per-explainer **Pulse** (views / interactions
/ shares).

---

## The contract (`lib/schemas.ts`)

The single hard dependency between the engine and the templates. It's a Zod
**discriminated union** keyed on `template`:

```ts
ExplainerConfig =
  | FunnelConfig      // { template:"funnel", title, unit, top_value, stages[], summary_metric }
  | FlowConfig        // { template:"flow", title, orientation, steps[] }
  | SystemConfig      // { template:"system", title, nodes[], edges[], request_path[] }
  | TradeoffConfig    // { template:"tradeoff", title, options[], criteria[] }
  | SimulatorConfig   // { template:"simulator", title, inputs[], outputs[], chart? }

GenerateResult = { template_id, config }   // refined so config.template === template_id
```

Because it's a discriminated union, validating `GenerateResult` guarantees the
config has exactly the right shape for the chosen template. A mismatch (or any
schema violation) is treated as an invalid generation → triggers the single
retry → else a graceful error. **A broken interactive never renders.**

---

## The engine (`lib/llm.ts`)

Provider-pluggable. Auto-detects whichever key is present
(`anthropic → groq → gemini → openrouter`); override with `LLM_PROVIDER` /
`LLM_MODEL`.

| Provider | Default model | JSON strategy |
| --- | --- | --- |
| Groq (free) | `llama-3.3-70b-versatile` | OpenAI `response_format: json_object` |
| Gemini (free) | `gemini-2.0-flash` | `responseMimeType: application/json` |
| OpenRouter (free tiers) | `meta-llama/llama-3.3-70b-instruct` | OpenAI JSON mode |
| Anthropic (paid) | `claude-sonnet-4-6` | assistant-turn prefill with `{` |

The classify+populate **system prompt** (`lib/prompts.ts`) is reproduced verbatim
from `vivid_prompts.md`. Generation runs at `temperature 0.5`, `max_tokens 3000`.
The response is parsed (with a salvage pass that extracts the outermost `{…}`),
validated, and retried once with a strict nudge. Non-Anthropic providers go over
plain `fetch` — **no extra SDK dependencies**.

---

## Simulator safety (`lib/evaluate.ts`)

The only template whose config contains executable math. We **never** use `eval`:

- Expressions run through **mathjs** on a hardened instance with
  `import`, `createUnit`, `evaluate`, `parse`, `simplify`, `derivative`, and
  `resolve` disabled.
- Every identifier in every expression is parsed out of the AST and checked
  against the **declared input ids** (plus a tiny constant allow-list). Any
  undeclared identifier fails validation → retry/reject.
- `/api/generate` runs `validateSimulatorConfig` before persisting, so a stored
  simulator always evaluates to finite numbers.

---

## Persistence (`lib/db.ts`)

Stores the explainer JSON by slug, plus the Pulse counters.

- **Supabase Postgres** when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set
  (the production default — survives Vercel's ephemeral filesystem). Tables:
  `explainers` and `explainer_pulse` (SQL in [README.md](README.md)).
- **Filesystem fallback** (`./.data`) otherwise, so the app runs end-to-end with
  zero setup locally.

---

## The Novus dogfood: Pulse + Coach

Vivid instruments itself with the exact funnel from the build spec:

```
landing_view → generate_clicked → explainer_rendered → knob_interacted
             → explainer_shared      (+ example_chip_used)
```

- `lib/analytics.ts` `track()` feeds Novus (whatever it exposes on `window`), a
  `window.__vividEvents` buffer, DOM `CustomEvent`s, and `/api/track`.
- `/api/track` aggregates a real per-explainer **Pulse** (views / interactions /
  shares). `PulseBar` surfaces it in-product — including the **interaction
  rate**, the core "did they actually poke it?" signal.
- The **Coach** (`/api/suggest`) reads a config + its Pulse and returns one
  concrete improvement. It only reasons over the explainer's own data — it is
  **not** a site-browsing agent.

---

## Security & guardrails

- **LLM keys are server-side only** — read solely inside the route handlers,
  never shipped to the client.
- **No `eval`** anywhere; mathjs is sandboxed (above).
- **Rate limiting** on the paid endpoints (`/api/generate`, `/api/suggest`) —
  8/min per IP — so a public URL can't be drained.
- **No `localStorage`/`sessionStorage`** — React state only.
- **Input cap** of 2000 chars; malformed/short input rejected with friendly 4xx.
- Reduced-motion respected; dark `theme-color` for mobile.

---

## File map

```
app/
  page.tsx                  landing: hero, input, recipe chips, seeded example
  v/[slug]/page.tsx         explainer (SSR) + Pulse + Coach + share
  api/generate/route.ts     classify + populate + validate + persist
  api/og/[slug]/route.tsx   dynamic OG image (edge)
  api/track/route.ts        Pulse aggregation
  api/suggest/route.ts      the Coach agent
components/
  template-renderer.tsx     switch on template_id
  templates/{funnel,flow,system,tradeoff,simulator}.tsx
  input-panel · share-bar · pulse-bar · improve-button · states · track-render
  ui/ (button, slider, card, textarea) · ui-kit/ (animated-number, knob, chrome)
lib/
  schemas.ts                THE CONTRACT (Zod discriminated union)
  llm.ts                    provider-pluggable engine (+ back-compat anthropic.ts shim)
  prompts.ts                system prompt (verbatim from vivid_prompts.md)
  evaluate.ts               mathjs sandbox + identifier whitelist
  db.ts                     Supabase | filesystem; explainers + pulse
  rate-limit.ts · analytics.ts · samples.ts · utils.ts
scripts/tune.mjs            15-prompt tuning harness (npm run tune)
```
