import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { generateExplainer, activeProvider } from "@/lib/llm";
import { saveExplainer } from "@/lib/db";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_DESCRIPTION = 2000;

const FRIENDLY_FAIL =
  "We couldn't compose a clean explainer for that. Try rephrasing — describe how something works, step by step or by the numbers.";

export async function POST(req: Request) {
  // ── Rate limit (protect the public, paid endpoint) ──
  const limit = checkRateLimit(clientKey(req));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Whoa — easy on the magic. Try again in a moment." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  // ── Validate input ──
  let description: string;
  try {
    const body = await req.json();
    description = typeof body?.description === "string" ? body.description : "";
  } catch {
    return NextResponse.json(
      { error: "Send a JSON body with a description." },
      { status: 400 },
    );
  }

  description = description.trim().slice(0, MAX_DESCRIPTION);
  if (description.length < 3) {
    return NextResponse.json(
      { error: "Tell us a little more about how it works." },
      { status: 400 },
    );
  }

  // LLM keys are read ONLY here, server-side. Never sent to the client.
  if (!activeProvider()) {
    return NextResponse.json(
      {
        error:
          "Generation isn't configured yet — set a free GROQ_API_KEY (or GEMINI_API_KEY / OPENROUTER_API_KEY / ANTHROPIC_API_KEY).",
      },
      { status: 500 },
    );
  }

  try {
    const outcome = await generateExplainer(description);

    if (!outcome.ok) {
      return NextResponse.json({ error: FRIENDLY_FAIL }, { status: 500 });
    }

    const slug = nanoid(10);
    await saveExplainer({
      slug,
      description,
      template_id: outcome.data.template_id,
      config: outcome.data.config,
    });

    return NextResponse.json({ slug, template_id: outcome.data.template_id });
  } catch (err) {
    console.error("[/api/generate]", err);
    return NextResponse.json(
      { error: "Vivid hit a snag composing that. Give it another go." },
      { status: 500 },
    );
  }
}
