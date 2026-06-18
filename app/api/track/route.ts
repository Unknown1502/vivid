import { NextResponse } from "next/server";
import { recordPulse, type PulseKind } from "@/lib/db";

export const runtime = "nodejs";

// Map the client funnel events to a pulse counter.
const EVENT_TO_KIND: Record<string, PulseKind> = {
  explainer_rendered: "view",
  knob_interacted: "interaction",
  explainer_shared: "share",
};

export async function POST(req: Request) {
  try {
    const { slug, event } = await req.json();
    if (typeof slug !== "string" || typeof event !== "string") {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const kind = EVENT_TO_KIND[event];
    if (kind && /^[A-Za-z0-9_-]{1,32}$/.test(slug)) {
      await recordPulse(slug, kind);
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
