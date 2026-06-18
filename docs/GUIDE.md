# Vivid — User Guide

Vivid turns a sentence about how your SaaS works into a live, interactive
explainer you can poke and share. No diagramming, no slides.

---

## The 30-second loop

1. **Describe it.** On the landing page, type how something works — or tap a
   recipe chip (Seat + usage pricing, Trial-to-paid funnel, Source → warehouse,
   SSO onboarding, Build vs buy).
2. **Vivid composes it.** It picks the best of five interactive templates and
   fills it with content specific to your description.
3. **Poke it.** Drag the knobs, step through, knock a node offline — the
   explainer reacts live.
4. **Share it.** Every explainer is a public URL (`/v/[slug]`) with a premium
   social preview. Send it to a prospect, drop it in onboarding.

> Tip: the more specific your sentence, the better the result. Mention real
> numbers, stages, services, or pricing terms ("60% drop after signup", "per
> 1,000 API calls", "load balancer → API → Postgres").

---

## How to phrase it well

| You want to explain… | Say something like… | You'll get |
| --- | --- | --- |
| Pricing / cost | "pricing: base fee + per-seat + usage overage per 1k calls" | **Simulator** |
| A drop-off / conversion | "trial-to-paid funnel; most drop before connecting a source" | **Funnel** |
| A process / "how X works" | "how SSO onboarding works, SAML setup to logged-in user" | **Flow** |
| An architecture / request path | "a request through our LB, API, cache, and DB" | **System** |
| A decision between options | "build vs buy our customer data platform" | **Tradeoff** |

If it's ambiguous, Vivid defaults to **Flow** (the most general).

---

## The five templates

### 1. Funnel — stages & drop-off
Ordered stages with pass-through rates. **Poke:** drag the top-of-funnel volume
or any stage's rate; downstream counts and the end-to-end conversion recompute
live, with a positive→warning color ramp that makes the leak obvious.
*Use for:* activation, trial-to-paid, checkout, sales pipeline.

### 2. Flow — how it works, step by step
Ordered (optionally branching) steps. **Poke:** Next/Prev to step through, tap a
step to expand its detail, follow a branch ("if denied → …").
*Use for:* OAuth/SSO, onboarding sequences, lifecycles, "how X works".

### 3. System — services & a live request
Nodes (client / service / datastore / external) connected by edges. **Poke:**
watch a request pulse along the path; tap any node to knock it **offline** and
see exactly what breaks downstream.
*Use for:* architecture, request lifecycle, data pipelines.

### 4. Tradeoff — weighted comparison
Options scored across weighted criteria. **Poke:** drag each criterion's weight
(auto-normalized); the ranking and the winner re-sort live with a spring.
*Use for:* build vs buy, tool/framework choices, prioritization.

### 5. Simulator — inputs → live outputs
Sliders feeding formulas. **Poke:** move each input; outputs (and an optional
chart) update instantly. Formulas are evaluated safely (mathjs, never `eval`).
*Use for:* pricing/seat/usage models, LTV/CAC, capacity & cost planning.

---

## On the explainer page (`/v/[slug]`)

- **Your description** is shown up top, so viewers know the source.
- **Share bar** — copy the link or post it; the social preview is auto-generated.
- **Live Pulse** — real, anonymous counts for *this* explainer: views, how many
  actually **poked it**, shares, and the **interaction rate**. It's the same
  funnel signal Vivid streams to Novus, surfaced in-product.
- **Coach** — "Improve this explainer" reads the config + the Pulse and suggests
  one concrete change (relabel a step, reorder stages, set a better default…).

---

## FAQ

**Is it accurate?** Vivid generates plausible, specific content from your
description — treat it as a strong first draft. Everything is editable in the
config, and the knobs let viewers explore the ranges themselves.

**Do I need an account?** No. Vivid is anonymous and shareable by link.

**Can people edit my explainer?** No — viewers manipulate the knobs in their own
browser session (nothing is saved back). The link always loads your version.

**Does it work on mobile?** Yes — every template is responsive and the
sliders/steps work by touch. Reduced-motion is respected.

**Which AI does it use?** Whichever you configure — a free model (Groq, Gemini,
OpenRouter) or Anthropic Claude. The AI only classifies and fills a typed
config; it never writes the interactive code (see [ARCHITECTURE.md](ARCHITECTURE.md)).

**What if a generation looks off?** Rephrase with more specifics, or open the
Coach for a suggested fix. Invalid configs are caught before anything renders,
so you never get a broken interactive.

---

## For the demo / judges

The landing page ships with a **live, seeded trial-to-paid funnel** — a stranger
gets value with zero typing. From there, the recipe chips each produce a
*different* template, showing the full range in three clicks.
