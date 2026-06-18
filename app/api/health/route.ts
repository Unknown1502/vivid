import { NextResponse } from "next/server";
import { activeProvider, providerHint } from "@/lib/llm";
import { persistenceMode, pingDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * At-a-glance status — confirm the LLM provider + persistence are wired before
 * recording/deploying. Reports detection + a live DB ping; never leaks secrets.
 */
export async function GET() {
  const provider = activeProvider();
  const persistence = persistenceMode();
  const db = await pingDb();

  return NextResponse.json({
    ok: Boolean(provider) && db.ok,
    llm: { configured: Boolean(provider), provider, model: providerHint() },
    persistence,
    db,
    time: new Date().toISOString(),
  });
}
