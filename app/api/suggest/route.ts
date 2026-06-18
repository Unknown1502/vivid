import { NextResponse } from "next/server";
import { complete, activeProvider } from "@/lib/llm";
import { getExplainer, getPulse } from "@/lib/db";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * The tiny improve-agent. Given an explainer's config + its real interaction
 * Pulse (the Novus signal), suggest ONE concrete change to make it land better
 * for a SaaS sales/onboarding audience. Not a site-browsing agent — it only
 * reasons over this explainer's own data.
 */
const SYSTEM = `You are Vivid's explainer coach. You are given one interactive explainer's config (a typed template) and its real interaction stats. Suggest exactly ONE concrete, specific improvement that would make it clearer or more engaging for a SaaS sales or onboarding audience — e.g. relabel a confusing step, reorder stages, set a better default on a slider, add a branch, or tighten a note. Reference the actual content. If interaction is low, bias toward making the first knob/step more inviting. Reply in 1–2 sentences, plain text, no preamble.`;

export async function POST(req: Request) {
  const limit = checkRateLimit("suggest:" + clientKey(req));
  if (!limit.ok)
    return NextResponse.json(
      { error: "One sec — try again in a moment." },
      { status: 429 },
    );

  let slug: string;
  try {
    slug = String((await req.json())?.slug ?? "");
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const record = await getExplainer(slug);
  if (!record)
    return NextResponse.json({ error: "Explainer not found." }, { status: 404 });

  if (!activeProvider())
    return NextResponse.json(
      { error: "The coach isn't configured — set a free GROQ_API_KEY." },
      { status: 503 },
    );

  try {
    const pulse = await getPulse(slug);
    const suggestion = await complete({
      system: SYSTEM,
      maxTokens: 220,
      temperature: 0.6,
      user: `Template: ${record.template_id}\nConfig:\n${JSON.stringify(
        record.config,
      )}\n\nInteraction pulse: ${pulse.views} views, ${pulse.interactions} interacted, ${pulse.shares} shares.`,
    });
    return NextResponse.json({ suggestion });
  } catch (err) {
    console.error("[/api/suggest]", err);
    return NextResponse.json(
      { error: "The coach hit a snag. Try again." },
      { status: 500 },
    );
  }
}
