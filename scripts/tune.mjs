#!/usr/bin/env node
/**
 * Vivid tuning harness (vivid_prompts.md "Tuning pass").
 *
 * Fires ~15 canonical descriptions at the real /api/generate pipeline, checks
 * classification against the expected template(s), and runs plausibility checks
 * on the generated config (no placeholder filler, valid ranges, coherent refs).
 *
 * Usage:
 *   1. Set ANTHROPIC_API_KEY in .env.local
 *   2. npm run dev            (in one terminal)
 *   3. npm run tune           (in another)  — or: BASE=https://your.app npm run tune
 *
 * Reads the persisted config from ./.data (filesystem persistence mode) for the
 * deep checks; with Supabase it still reports classification.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE || "http://localhost:3000";
const DELAY_MS = Number(process.env.DELAY || 3500); // pace between prompts
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// expected = allowed template ids (some prompts are legitimately ambiguous)
const CASES = [
  { d: "our activation funnel where 60% drop after signup", expected: ["funnel"] },
  { d: "how the OAuth 2.0 authorization code flow works", expected: ["flow"] },
  {
    d: "the lifecycle of an HTTP request through our load balancer, API, and database",
    expected: ["system"],
  },
  { d: "build vs buy for our internal analytics", expected: ["tradeoff"] },
  {
    d: "how our pricing scales: a base platform fee plus per-seat per-month",
    expected: ["simulator"],
  },
  { d: "checkout", expected: ["funnel", "flow"] }, // thin input
  {
    d: "should we use Postgres or MongoDB for our new service?",
    expected: ["tradeoff"],
  }, // comparison phrased as a question
  {
    d: "how a Kubernetes pod gets scheduled onto a node",
    expected: ["flow", "system"],
  },
  { d: "our sales pipeline from lead to closed-won", expected: ["funnel"] },
  { d: "unit economics: LTV vs CAC for our SaaS", expected: ["simulator"] },
  {
    d: "the architecture of our event-driven order system",
    expected: ["system"],
  },
  { d: "onboarding sequence for new users", expected: ["flow", "funnel"] },
  {
    d: "capacity planning: how many servers we need for a given request rate",
    expected: ["simulator"],
  },
  { d: "compare React, Vue and Svelte for our frontend", expected: ["tradeoff"] },
  {
    d: "how a credit card payment settles end to end",
    expected: ["flow", "system"],
  },
];

const BANNED = [
  /\bstep\s*\d+\b/i,
  /\boption\s*[a-c]\b/i,
  /\bservice\s*\d+\b/i,
  /lorem ipsum/i,
  /\bplaceholder\b/i,
];

function plausibility(template, config) {
  const flags = [];
  const blob = JSON.stringify(config);
  for (const re of BANNED) if (re.test(blob)) flags.push(`placeholder-ish: ${re}`);

  if (template === "funnel") {
    if (!(config.stages?.length >= 2 && config.stages.length <= 7))
      flags.push("stages out of 2–7");
    if (config.stages?.some((s) => s.rate < 0 || s.rate > 1))
      flags.push("rate out of 0–1");
    if (!(config.top_value > 0)) flags.push("top_value not positive");
  }
  if (template === "flow") {
    if (!(config.steps?.length >= 2)) flags.push("too few steps");
    if (config.steps?.some((s) => (s.detail ?? "").length < 8))
      flags.push("thin step detail");
  }
  if (template === "system") {
    const ids = new Set((config.nodes ?? []).map((n) => n.id));
    if ((config.request_path ?? []).some((id) => !ids.has(id)))
      flags.push("request_path references unknown node");
    if ((config.edges ?? []).some((e) => !ids.has(e.from) || !ids.has(e.to)))
      flags.push("edge references unknown node");
  }
  if (template === "tradeoff") {
    const n = config.options?.length ?? 0;
    if (config.criteria?.some((c) => c.scores?.length !== n))
      flags.push("scores length ≠ options length");
    // all-equal scores within a criterion are banned by the prompt
    if (
      config.criteria?.some(
        (c) => c.scores && new Set(c.scores).size === 1,
      )
    )
      flags.push("a criterion has all-equal scores");
  }
  if (template === "simulator") {
    const ids = new Set((config.inputs ?? []).map((i) => i.id));
    for (const o of config.outputs ?? []) {
      const refs = (o.expression || "").match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      const fns = new Set([
        "min", "max", "round", "floor", "ceil", "abs", "sqrt", "pow",
        "log", "exp", "pi", "e",
      ]);
      const bad = refs.filter((r) => !ids.has(r) && !fns.has(r));
      if (bad.length) flags.push(`expression refs undeclared: ${bad.join(",")}`);
    }
  }
  return flags;
}

async function loadConfig(slug) {
  try {
    const p = path.join(process.cwd(), ".data", "explainers", `${slug}.json`);
    const raw = await readFile(p, "utf8");
    return JSON.parse(raw).config;
  } catch {
    return null;
  }
}

async function run() {
  console.log(`\nVivid tuning pass → ${BASE}/api/generate\n${"─".repeat(64)}`);
  let classifyOk = 0;
  let plausibleOk = 0;
  let deepChecked = 0;

  for (const [i, c] of CASES.entries()) {
    let line = `${String(i + 1).padStart(2)}. ${c.d.slice(0, 46).padEnd(46)} `;
    try {
      const res = await fetch(`${BASE}/api/generate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: c.d }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.slug) {
        console.log(line + `❌ HTTP ${res.status} ${data.error ?? ""}`);
        continue;
      }
      const got = data.template_id;
      const hit = c.expected.includes(got);
      if (hit) classifyOk++;
      line += `${hit ? "✅" : "⚠️ "} ${got.padEnd(9)} (want ${c.expected.join("/")})`;

      const config = await loadConfig(data.slug);
      if (config) {
        deepChecked++;
        const flags = plausibility(got, config);
        if (flags.length === 0) {
          plausibleOk++;
          line += "  · config ok";
        } else {
          line += `  · ⚑ ${flags.join("; ")}`;
        }
      }
      console.log(line + `  /v/${data.slug}`);
    } catch (e) {
      console.log(line + `❌ ${e.message}`);
    }
    // pace requests so free-tier provider limits + the app rate limit don't trip
    if (i < CASES.length - 1) await sleep(DELAY_MS);
  }

  console.log("─".repeat(64));
  console.log(
    `Classification: ${classifyOk}/${CASES.length} within expected set`,
  );
  if (deepChecked)
    console.log(
      `Plausibility:   ${plausibleOk}/${deepChecked} clean (read from ./.data)`,
    );
  console.log(
    "\nReview any ⚠️ (misclassification) or ⚑ (config) rows. Fix by sharpening",
    "\nthe per-template guidance in lib/prompts.ts, then re-run.\n",
  );
}

run();
