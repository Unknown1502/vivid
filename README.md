# Vivid

**Turn how something works into something you can poke.**

Type a plain-English description — _"our activation funnel where 60% drop after
signup"_, _"how OAuth works"_, _"pricing that scales with seats"_ — and Vivid
classifies it into one of five hand-built interactive templates, generates a
typed config that fills it, renders a polished interactive you can manipulate,
and gives you a shareable public link.

The load-bearing idea: **the AI never writes interactive code.** It only (a)
picks a template and (b) returns a typed config validated against a Zod
contract. Every interactive is hand-built and polished. That's what keeps
generation reliable.

## Docs

- [GUIDE.md](GUIDE.md) — how to use Vivid, the five templates, FAQ
- [ARCHITECTURE.md](ARCHITECTURE.md) — the design, data flow, contract, safety
- [SUBMISSION.md](SUBMISSION.md) — Devpost write-up + checklist
- [DEMO.md](DEMO.md) — 2:30 demo video script + shot list

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind + shadcn-style primitives (restyled tokens — committed dark editorial theme)
- **Provider-pluggable LLM** (server-side only): Groq · Gemini · OpenRouter (all have free tiers) or Anthropic Claude
- Zod (validation contract) · mathjs (simulator — never `eval`) · framer-motion (motion)
- nanoid (slugs) · Supabase Postgres _or_ a local filesystem fallback
- Vercel-ready

## Run it

```bash
npm install
cp .env.example .env.local        # then add ONE LLM key (free GROQ_API_KEY recommended)
npm run dev                       # http://localhost:3000
```

The landing page and its seeded interactive example work with **no key at all**.
Generation needs one LLM key — get a **free** one from
[Groq](https://console.groq.com/keys) (recommended) or
[Google AI Studio](https://aistudio.google.com/apikey). With no Supabase vars,
explainers persist to a local `./.data` folder so everything works end-to-end.

### LLM provider

Vivid auto-detects whichever key is present (order: `anthropic → groq → gemini →
openrouter`). Force one with `LLM_PROVIDER`, and override the model with
`LLM_MODEL`.

| Key | Default model | Cost |
| --- | --- | --- |
| `GROQ_API_KEY` | `llama-3.3-70b-versatile` | **free** (fast — great demo) |
| `GEMINI_API_KEY` | `gemini-2.0-flash` | **free** tier |
| `OPENROUTER_API_KEY` | `meta-llama/llama-3.3-70b-instruct` | free model variants |
| `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` | paid (highest quality) |

### Environment

| Var | Required | Purpose |
| --- | --- | --- |
| one LLM key (above) | for generation | Read only server-side, never client-side |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | for prod sharing | Persist explainers + pulse (see SQL below) |
| `NEXT_PUBLIC_SITE_URL` | for absolute OG/share links | e.g. your Vercel URL |
| `NEXT_PUBLIC_NOVUS_SRC` | for Novus custom events | optional client snippet URL |

## Deploy (Vercel)

```bash
npm i -g vercel        # if needed
vercel                 # preview deploy
vercel --prod          # production
```

Set your chosen LLM key (e.g. a free `GROQ_API_KEY`) and, for persistent
sharing, the Supabase vars in the Vercel project's Environment Variables.
Vercel's filesystem is ephemeral, so for shared `/v/[slug]` links + Pulse in
production use Supabase:

```sql
create table explainers (
  slug        text primary key,
  created_at  timestamptz not null default now(),
  description text not null,
  template_id text not null,
  config      jsonb not null
);

-- Per-explainer interaction Pulse (the Novus dogfood surfaced in-product)
create table explainer_pulse (
  slug         text primary key,
  views        int not null default 0,
  interactions int not null default 0,
  shares       int not null default 0
);
```

## The five templates

| Template | For | Interactive |
| --- | --- | --- |
| **Funnel** | activation / checkout drop-off | drag top-of-funnel + per-stage rates; counts & conversion recompute |
| **Flow** | "how X works", lifecycles | Next/Prev step-through, expand detail, branch jumps |
| **System** | architecture, request lifecycle | animated request pulse; knock a node offline → broken path |
| **Tradeoff** | build vs buy, prioritization | weight sliders; ranking + winner spring-re-sort |
| **Simulator** | pricing, unit economics | a slider per input; outputs + chart update live via mathjs |

## Project structure

```
app/
  page.tsx                  landing + input + seeded example
  v/[slug]/page.tsx         explainer (SSR)
  api/generate/route.ts     classify + populate + validate + persist
  api/og/[slug]/route.tsx   dynamic OG image
components/
  template-renderer.tsx     switch on template_id
  templates/{funnel,flow,system,tradeoff,simulator}.tsx
  input-panel.tsx · share-bar.tsx · states.tsx
  ui/ · ui-kit/             shared knobs, cards, animated numbers
lib/
  schemas.ts                §5 — the frozen contract
  anthropic.ts              prefill + zod + single retry
  prompts.ts · evaluate.ts (mathjs + identifier whitelist) · db.ts · samples.ts
```
