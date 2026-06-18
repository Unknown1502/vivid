import { promises as fs } from "fs";
import path from "path";
import type { ExplainerConfig, TemplateId } from "./schemas";

/**
 * Persistence (vivid_build_spec.md §5.1). Store the explainer JSON by slug.
 *
 *  - If SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, use Supabase Postgres
 *    (the production default — survives Vercel's ephemeral filesystem).
 *  - Otherwise fall back to a local filesystem store under ./.data so the app
 *    runs end-to-end with zero setup.
 */

export interface ExplainerRecord {
  slug: string;
  created_at: string;
  description: string;
  template_id: TemplateId;
  config: ExplainerConfig;
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usingSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

export function persistenceMode(): "supabase" | "filesystem" {
  return usingSupabase ? "supabase" : "filesystem";
}

// ── Supabase backend ────────────────────────────────────────────────────────
async function getSupabase() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false },
  });
}

// ── Filesystem backend ──────────────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), ".data", "explainers");

async function fsSave(rec: ExplainerRecord) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `${rec.slug}.json`),
    JSON.stringify(rec, null, 2),
    "utf8",
  );
}

async function fsGet(slug: string): Promise<ExplainerRecord | null> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${slug}.json`), "utf8");
    return JSON.parse(raw) as ExplainerRecord;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────
export async function saveExplainer(
  input: Omit<ExplainerRecord, "created_at"> & { created_at?: string },
): Promise<ExplainerRecord> {
  const rec: ExplainerRecord = {
    created_at: input.created_at ?? new Date().toISOString(),
    ...input,
  };

  if (usingSupabase) {
    const supabase = await getSupabase();
    const { error } = await supabase.from("explainers").insert({
      slug: rec.slug,
      description: rec.description,
      template_id: rec.template_id,
      config: rec.config,
    });
    if (error) throw new Error(`Supabase insert failed: ${error.message}`);
    return rec;
  }

  await fsSave(rec);
  return rec;
}

export async function getExplainer(
  slug: string,
): Promise<ExplainerRecord | null> {
  if (usingSupabase) {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("explainers")
      .select("slug, created_at, description, template_id, config")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return (data as ExplainerRecord | null) ?? null;
  }

  return fsGet(slug);
}

// ── Pulse: real per-explainer interaction counters (the Novus dogfood) ───────
// Honest aggregate of the same funnel signal we send Novus, surfaced in-product.

export interface Pulse {
  views: number;
  interactions: number; // viewers who poked a knob/step/node
  shares: number;
}

export type PulseKind = "view" | "interaction" | "share";

const emptyPulse = (): Pulse => ({ views: 0, interactions: 0, shares: 0 });
const PULSE_DIR = path.join(process.cwd(), ".data", "pulse");

export async function getPulse(slug: string): Promise<Pulse> {
  if (usingSupabase) {
    const supabase = await getSupabase();
    const { data } = await supabase
      .from("explainer_pulse")
      .select("views, interactions, shares")
      .eq("slug", slug)
      .maybeSingle();
    return { ...emptyPulse(), ...(data ?? {}) } as Pulse;
  }
  try {
    const raw = await fs.readFile(path.join(PULSE_DIR, `${slug}.json`), "utf8");
    return { ...emptyPulse(), ...JSON.parse(raw) } as Pulse;
  } catch {
    return emptyPulse();
  }
}

export async function recordPulse(
  slug: string,
  kind: PulseKind,
): Promise<void> {
  const field =
    kind === "view" ? "views" : kind === "share" ? "shares" : "interactions";

  if (usingSupabase) {
    const current = await getPulse(slug);
    const next: Pulse = { ...current, [field]: current[field] + 1 };
    const supabase = await getSupabase();
    await supabase
      .from("explainer_pulse")
      .upsert({ slug, ...next }, { onConflict: "slug" });
    return;
  }

  await fs.mkdir(PULSE_DIR, { recursive: true });
  const current = await getPulse(slug);
  const next: Pulse = { ...current, [field]: current[field] + 1 };
  await fs.writeFile(
    path.join(PULSE_DIR, `${slug}.json`),
    JSON.stringify(next),
    "utf8",
  );
}

export async function countExplainers(): Promise<number> {
  if (usingSupabase) {
    try {
      const supabase = await getSupabase();
      const { count, error } = await supabase
        .from("explainers")
        .select("slug", { count: "exact", head: true });
      if (error) return 0;
      return count ?? 0;
    } catch {
      return 0;
    }
  }
  try {
    const files = await fs.readdir(DATA_DIR);
    return files.filter((f) => f.endsWith(".json")).length;
  } catch {
    return 0;
  }
}

export async function getAllSlugs(): Promise<
  { slug: string; created_at: string }[]
> {
  if (usingSupabase) {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from("explainers")
        .select("slug, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      if (error) return [];
      return (data ?? []) as { slug: string; created_at: string }[];
    } catch {
      return [];
    }
  }
  try {
    const files = await fs.readdir(DATA_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => ({ slug: f.replace(".json", ""), created_at: new Date().toISOString() }));
  } catch {
    return [];
  }
}


export async function pingDb(): Promise<{ ok: boolean; error?: string }> {
  if (usingSupabase) {
    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("explainers")
        .select("slug", { count: "exact", head: true });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "unreachable" };
    }
  }
  return { ok: true };
}
