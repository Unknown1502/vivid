import { z } from "zod";

/**
 * THE CONTRACT (vivid_build_spec.md §5).
 *
 * This file is the single hard dependency between the engine (/api/generate)
 * and the templates (components/templates/*). The AI only ever (a) picks a
 * template and (b) returns a config that validates here. Interactive code is
 * hand-built and never generated. Keep this boundary absolute.
 */

// ── Shared ────────────────────────────────────────────────────────────────
const Note = z.string(); // short annotation

// ── 1. Funnel ──────────────────────────────────────────────────────────────
export const FunnelConfig = z.object({
  template: z.literal("funnel"),
  title: z.string(),
  unit: z.string(), // "users", "sessions", ...
  top_value: z.number().positive(), // top-of-funnel count (editable)
  stages: z
    .array(
      z.object({
        label: z.string(),
        rate: z.number().min(0).max(1), // pass-through rate from previous stage (editable)
        note: Note.optional(),
      }),
    )
    .min(2)
    .max(7),
  summary_metric: z.string(), // what the live summary shows, e.g. "End-to-end conversion"
});

// ── 2. Flow / Process ───────────────────────────────────────────────────────
export const FlowConfig = z.object({
  template: z.literal("flow"),
  title: z.string(),
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  steps: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        detail: z.string(), // shown on expand
        branches: z
          .array(z.object({ to: z.string(), condition: z.string() }))
          .optional(),
      }),
    )
    .min(2)
    .max(8),
});

// ── 3. System diagram ───────────────────────────────────────────────────────
export const SystemConfig = z.object({
  template: z.literal("system"),
  title: z.string(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["client", "service", "datastore", "external"]),
      }),
    )
    .min(2)
    .max(8),
  edges: z.array(
    z.object({ from: z.string(), to: z.string(), label: z.string().optional() }),
  ),
  request_path: z.array(z.string()).min(2), // node ids, in order, for the animated request
});

// ── 4. Tradeoff / Comparison ────────────────────────────────────────────────
export const TradeoffConfig = z.object({
  template: z.literal("tradeoff"),
  title: z.string(),
  options: z.array(z.string()).min(2).max(5),
  criteria: z
    .array(
      z.object({
        name: z.string(),
        weight: z.number().min(0).max(1), // editable; UI normalizes
        scores: z.array(z.number().min(0).max(10)), // one per option, same order as options
      }),
    )
    .min(2)
    .max(6),
});

// ── 5. Metric simulator ─────────────────────────────────────────────────────
export const SimulatorConfig = z.object({
  template: z.literal("simulator"),
  title: z.string(),
  inputs: z
    .array(
      z.object({
        id: z.string(), // referenced in expressions
        label: z.string(),
        min: z.number(),
        max: z.number(),
        default: z.number(),
        step: z.number().positive(),
        unit: z.string().optional(),
      }),
    )
    .min(1)
    .max(5),
  outputs: z
    .array(
      z.object({
        label: z.string(),
        expression: z.string(), // math in terms of input ids, eval'd with mathjs (NO eval)
        unit: z.string().optional(),
      }),
    )
    .min(1)
    .max(3),
  chart: z
    .object({ x_input_id: z.string(), output_index: z.number().int() })
    .optional(),
});

export const ExplainerConfig = z.discriminatedUnion("template", [
  FunnelConfig,
  FlowConfig,
  SystemConfig,
  TradeoffConfig,
  SimulatorConfig,
]);

export const GenerateResult = z
  .object({
    template_id: z.enum([
      "funnel",
      "flow",
      "system",
      "tradeoff",
      "simulator",
    ]),
    config: ExplainerConfig,
  })
  // config.template MUST equal template_id (the prompt requires it). A mismatch
  // is treated as an invalid generation so the route's single retry can fix it.
  .refine((r) => r.config.template === r.template_id, {
    message: "config.template must equal template_id",
    path: ["config", "template"],
  });

// ── Inferred types (used by every template + the renderer) ──────────────────
export type FunnelConfig = z.infer<typeof FunnelConfig>;
export type FlowConfig = z.infer<typeof FlowConfig>;
export type SystemConfig = z.infer<typeof SystemConfig>;
export type TradeoffConfig = z.infer<typeof TradeoffConfig>;
export type SimulatorConfig = z.infer<typeof SimulatorConfig>;
export type ExplainerConfig = z.infer<typeof ExplainerConfig>;
export type GenerateResult = z.infer<typeof GenerateResult>;
export type TemplateId = GenerateResult["template_id"];
