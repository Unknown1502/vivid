import Anthropic from "@anthropic-ai/sdk";
import { GenerateResult } from "./schemas";
import { SYSTEM_PROMPT, buildUserPrompt, RETRY_NUDGE } from "./prompts";
import { validateSimulatorConfig } from "./evaluate";

/**
 * Provider-pluggable LLM layer.
 *
 * The hackathon requires no specific API, so Vivid runs on whichever key is
 * present — including a FREE one. Auto-detection order (override with
 * LLM_PROVIDER): anthropic → groq → gemini → openrouter. Default model per
 * provider is overridable with LLM_MODEL.
 *
 *   Free + fast + deployable:  GROQ_API_KEY     (Llama 3.3 70B, recommended)
 *   Free + capable:            GEMINI_API_KEY   (Gemini 2.0 Flash)
 *   Free model variants:       OPENROUTER_API_KEY
 *   Highest quality (paid):    ANTHROPIC_API_KEY (claude-sonnet-4-6)
 */

export type Provider = "anthropic" | "groq" | "gemini" | "openrouter";

const DEFAULT_MODEL: Record<Provider, string> = {
  anthropic: "claude-sonnet-4-6",
  groq: "llama-3.3-70b-versatile",
  gemini: "gemini-2.0-flash",
  openrouter: "meta-llama/llama-3.3-70b-instruct",
};

const LABEL: Record<Provider, string> = {
  anthropic: "Anthropic Claude",
  groq: "Groq",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

interface Selection {
  provider: Provider;
  key: string;
  model: string;
}

function keyFor(p: Provider): string | undefined {
  switch (p) {
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    case "groq":
      return process.env.GROQ_API_KEY;
    case "gemini":
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
  }
}

/** Every configured provider, in fallback order. LLM_PROVIDER forces one. */
function configuredProviders(): Selection[] {
  const override = process.env.LLM_PROVIDER as Provider | undefined;
  const order: Provider[] = override
    ? [override]
    : ["anthropic", "groq", "gemini", "openrouter"];
  const out: Selection[] = [];
  for (const provider of order) {
    const key = keyFor(provider);
    if (key)
      out.push({
        provider,
        key,
        model: process.env.LLM_MODEL || DEFAULT_MODEL[provider],
      });
  }
  return out;
}

function pickProvider(): Selection | null {
  return configuredProviders()[0] ?? null;
}

export function activeProvider(): Provider | null {
  return pickProvider()?.provider ?? null;
}

export function providerHint(): string {
  const all = configuredProviders();
  if (!all.length) return "none";
  const primary = `${LABEL[all[0].provider]} (${all[0].model})`;
  const fallbacks = all.slice(1).map((s) => LABEL[s.provider]);
  return fallbacks.length ? `${primary} → ${fallbacks.join(" → ")}` : primary;
}

// ── Unified model call. Returns the full assistant text (JSON-ready). ────────
interface CallOpts {
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
  json: boolean;
}

async function callModel(sel: Selection, opts: CallOpts): Promise<string> {
  switch (sel.provider) {
    case "anthropic": {
      const client = new Anthropic({ apiKey: sel.key });
      const msg = await client.messages.create({
        model: sel.model,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        system: opts.system,
        messages: [
          { role: "user", content: opts.user },
          // prefill the JSON open-brace so the model emits JSON only
          ...(opts.json
            ? [{ role: "assistant" as const, content: "{" }]
            : []),
        ],
      });
      const text = msg.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("");
      return opts.json ? "{" + text : text;
    }

    case "groq":
    case "openrouter": {
      const url =
        sel.provider === "groq"
          ? "https://api.groq.com/openai/v1/chat/completions"
          : "https://openrouter.ai/api/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sel.key}`,
        },
        body: JSON.stringify({
          model: sel.model,
          temperature: opts.temperature,
          max_tokens: opts.maxTokens,
          messages: [
            { role: "system", content: opts.system },
            { role: "user", content: opts.user },
          ],
          ...(opts.json ? { response_format: { type: "json_object" } } : {}),
        }),
      });
      if (!res.ok)
        throw new Error(`${LABEL[sel.provider]} ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return data?.choices?.[0]?.message?.content ?? "";
    }

    case "gemini": {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${sel.model}:generateContent?key=${sel.key}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: opts.system }] },
            contents: [{ role: "user", parts: [{ text: opts.user }] }],
            generationConfig: {
              temperature: opts.temperature,
              maxOutputTokens: opts.maxTokens,
              ...(opts.json ? { responseMimeType: "application/json" } : {}),
            },
          }),
        },
      );
      if (!res.ok)
        throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return (
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text ?? "")
          .join("") ?? ""
      );
    }
  }
}

/** Plain-text completion (used by the Coach). Falls back across providers. */
export async function complete(opts: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const providers = configuredProviders();
  if (!providers.length) throw new Error("No LLM provider configured");
  let lastErr: unknown;
  for (const sel of providers) {
    try {
      const text = await callModel(sel, {
        system: opts.system,
        user: opts.user,
        temperature: opts.temperature ?? 0.6,
        maxTokens: opts.maxTokens ?? 256,
        json: false,
      });
      if (text.trim()) return text.trim();
      lastErr = new Error(`${sel.provider} returned empty`);
    } catch (e) {
      lastErr = e;
      if (process.env.LLM_DEBUG)
        console.error(`[LLM_DEBUG] complete ${sel.provider} failed:`, (e as any)?.message);
    }
  }
  throw lastErr ?? new Error("All providers failed");
}

// ── Explainer generation (classify + populate) ──────────────────────────────
export type GenerateOutcome =
  | { ok: true; data: GenerateResult }
  | { ok: false; error: string };

function parseJson(raw: string): unknown | null {
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(raw.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function validate(parsed: unknown): GenerateOutcome {
  const result = GenerateResult.safeParse(parsed);
  if (!result.success)
    return {
      ok: false,
      error: result.error.issues[0]?.message ?? "Invalid shape",
    };
  const { config } = result.data;
  if (config.template === "simulator") {
    const sim = validateSimulatorConfig(config);
    if (!sim.ok) return { ok: false, error: sim.errors.join("; ") };
  }
  return { ok: true, data: result.data };
}

/**
 * Classify + populate. For each configured provider: one call, then a single
 * strict retry on validation failure (vivid_build_spec.md §6). If a provider
 * errors (e.g. rate limit) or fails validation twice, fall back to the next
 * configured provider. Returns the first valid result.
 */
export async function generateExplainer(
  description: string,
): Promise<GenerateOutcome> {
  const providers = configuredProviders();
  if (!providers.length)
    return { ok: false, error: "No LLM provider configured" };

  const user = buildUserPrompt(description);
  const opts = { temperature: 0.5, maxTokens: 3000, json: true };
  let lastError = "no attempt made";

  for (const sel of providers) {
    try {
      const first = await callModel(sel, { system: SYSTEM_PROMPT, user, ...opts });
      const o1 = validate(parseJson(first));
      if (o1.ok) return o1;
      lastError = o1.error;
      if (process.env.LLM_DEBUG) {
        console.error(`[LLM_DEBUG] ${sel.provider} attempt1:`, o1.error);
        console.error(`[LLM_DEBUG] ${sel.provider} raw1:`, first.slice(0, 1000));
      }

      const second = await callModel(sel, {
        system: SYSTEM_PROMPT,
        user: `${user}\n\n${RETRY_NUDGE}`,
        ...opts,
      });
      const o2 = validate(parseJson(second));
      if (o2.ok) return o2;
      lastError = o2.error;
      if (process.env.LLM_DEBUG) {
        console.error(`[LLM_DEBUG] ${sel.provider} attempt2:`, o2.error);
        console.error(`[LLM_DEBUG] ${sel.provider} raw2:`, second.slice(0, 1000));
      }
      // validation failed twice → try the next provider
    } catch (e: any) {
      lastError = `${sel.provider}: ${e?.message ?? "request failed"}`;
      if (process.env.LLM_DEBUG)
        console.error(`[LLM_DEBUG] ${sel.provider} threw:`, e?.message);
      // transport/rate-limit error → try the next provider
    }
  }

  return { ok: false, error: `All providers failed: ${lastError}` };
}
