# Vivid — Devpost Submission

Copy-paste ready. Fill the `[brackets]` with your real links/numbers before you
submit. (Demo video script lives in [DEMO.md](DEMO.md).)

---

## Tagline

**Describe how your SaaS works in a sentence. Get an interactive explainer
prospects and new hires can poke.**

## Elevator pitch (≤ 200 chars)

Vivid turns one plain-English sentence — your pricing, funnel, architecture, or
onboarding — into a live, interactive, shareable explainer. The AI never writes
UI; it just picks a template and fills a typed config.

---

## What it is

Vivid turns a plain-English description of how your SaaS works into a **live,
interactive, shareable explainer**. Type *"how our pricing works: base fee plus
per-seat plus usage overage"* or *"our trial-to-paid funnel where users drop
before connecting a data source"* — Vivid classifies it into one of five
hand-built interactive templates (funnel, flow, system, tradeoff, simulator),
fills a typed config, and renders an interactive on a shareable URL with a
premium social preview.

## Who it's for & why it matters

SaaS **product, sales-enablement, and onboarding** teams. For complex products,
the expensive moments are *explanations*:

- **Pricing** stalls deals — "what will this actually cost us?"
- **Architecture** slows security reviews and integration.
- **Onboarding** that's hard to follow burns support tickets.

Static slides and diagrams fail because nobody internalizes a system until they
can change an input and watch it react. Vivid makes the explanation **pokeable**,
so the buyer models their own bill and the new hire walks the flow themselves.

## The interesting technical bet

**The AI never writes interactive code.** We hand-built five polished templates;
the model only (a) picks the right one and (b) returns a typed config validated
against a Zod discriminated-union contract, with a single strict retry on
failure. That boundary is what makes generation reliable — there are no
generated buttons to break. The simulator's formulas run through **mathjs** on a
sandboxed instance against a whitelist of declared inputs — **never `eval`**.

Vivid also **dogfoods Novus**: it instruments its own funnel, surfaces a live
interaction **Pulse** in-product (views / poked-it / interaction-rate), and a
small **Coach** agent reads that Pulse to suggest the next improvement.

## How we built it

Next.js 14 (App Router) + TypeScript · Tailwind with restyled tokens (committed
dark editorial theme) · a **provider-pluggable LLM layer** (Groq / Gemini /
OpenRouter — all free — or Anthropic Claude), server-side only · Zod for the
validation contract · mathjs for safe formula evaluation · framer-motion for
purposeful motion · Supabase (with a filesystem fallback) · deployed on Vercel ·
instrumented with **Novus**.

## What we learned

[Your Novus before/after — the ONE concrete thing you changed because of it.
e.g. "Novus showed X% generated an explainer but never touched a knob; we added
a 'drag the leak' hint + a seeded live example on the landing page, and
interaction rose from A% to B%."]

## What's next

[Optional: per-step Pulse heatmaps ("most viewers never reach step 3"),
embeddable explainers, team workspaces.]

---

## Links

- **Live app:** [https://...]
- **Demo video (2–3 min):** [https://...]
- **Repo:** [https://...]
- **Novus dashboard screenshot:** [attach]

## Built with (Devpost tags)

`next.js` · `typescript` · `tailwindcss` · `groq` (or `anthropic`) · `zod` ·
`mathjs` · `framer-motion` · `supabase` · `vercel` · `novus`

---

## Final submission checklist

- [ ] Public URL to the deployed, working project (new work, after May 20)
- [ ] **Novus installed** + dashboard **screenshot**
- [ ] 2–3 min demo video (public/unlisted) — script in DEMO.md
- [ ] Written description (this file)
- [ ] One LLM key set in prod (free `GROQ_API_KEY` is fine)
- [ ] **Supabase configured** so shared `/v/[slug]` links + Pulse survive
- [ ] Seeded interactive example renders instantly on the landing page ✔
- [ ] `npm run tune` reviewed — classification clean, no config flags
- [ ] Tested in **incognito on mobile**
- [ ] (Encouraged) LinkedIn post #EveryoneShipsNow tagging @Mind the Product
- [ ] Submitted on Devpost **before Fri 20 Jun, 5:00pm BST**
