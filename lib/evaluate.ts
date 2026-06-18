import { create, all, type MathNode } from "mathjs";
import type { SimulatorConfig } from "./schemas";

/**
 * Simulator math. NEVER use eval.
 *
 * vivid_build_spec.md §5: evaluate `expression` with mathjs, scope = { inputId:
 * value }, and validate that every identifier in each expression is a declared
 * input id — reject otherwise.
 *
 * Two instances on purpose:
 *  - `parser` (full): used ONLY to parse expressions into an AST so we can
 *    inspect their identifiers. Parsing executes nothing, so it's safe.
 *  - `evaluator` (hardened): computes values with `evaluator.evaluate(expr,
 *    scope)`. The mathjs RCE vectors `import` and `createUnit` are disabled, so
 *    an expression that calls them throws → the config is rejected. We do NOT
 *    disable `evaluate`/`parse` themselves (we need to call them). Belt-and-
 *    suspenders: validateExpression also whitelists which functions may appear.
 */
const math = create(all, {});
const evaluator = create(all, {});

// Constants are not user variables, but are legitimate in formulas.
const ALLOWED_CONSTANTS = new Set(["pi", "e", "tau", "phi", "PI", "E"]);

// Functions an expression is allowed to call. Anything else (import, createUnit,
// evaluate, parse, simplify, map, …) is rejected before evaluation.
const ALLOWED_FUNCTIONS = new Set([
  "min", "max", "round", "floor", "ceil", "abs", "sqrt", "cbrt", "pow",
  "exp", "log", "log10", "log2", "mod", "sign", "hypot", "sum", "mean",
]);

const disabled = () => {
  throw new Error("disabled");
};
evaluator.import(
  { import: disabled, createUnit: disabled },
  { override: true },
);

/**
 * Normalize a model-written expression before parsing. Strips thousands
 * separators (commas between digits, e.g. `1,000` → `1000`) — a common LLM
 * quirk that otherwise makes the expression unparseable — without touching
 * the commas that separate function arguments like `min(a, b)`.
 */
export function normalizeExpression(expression: string): string {
  return expression.replace(/(?<=\d)[,_](?=\d)/g, "");
}

/** Parse an expression and separate value identifiers from called functions. */
function inspect(expression: string): { vars: string[]; fns: string[] } {
  const node: MathNode = math.parse(normalizeExpression(expression));
  const vars = new Set<string>();
  const fns = new Set<string>();
  node.traverse((n: any, _path: string, parent: any) => {
    if (n.type === "SymbolNode") {
      // a symbol that names a called function: f(...) -> f is parent.fn
      if (parent && parent.type === "FunctionNode" && parent.fn === n) {
        fns.add(n.name);
      } else {
        vars.add(n.name);
      }
    }
  });
  return { vars: [...vars], fns: [...fns] };
}

/**
 * Collect the variable identifiers referenced by an expression. Function names
 * (e.g. `min`, `round`) are excluded — only value symbols are returned.
 */
export function extractIdentifiers(expression: string): string[] {
  return inspect(expression).vars;
}

export type ExprValidation =
  | { ok: true }
  | { ok: false; reason: string; unknown: string[] };

/** Every identifier must be a declared input id (or constant); every function
 * call must be on the allow-list. */
export function validateExpression(
  expression: string,
  declaredIds: string[],
): ExprValidation {
  let parsed: { vars: string[]; fns: string[] };
  try {
    parsed = inspect(expression);
  } catch (e) {
    return { ok: false, reason: "Unparseable expression", unknown: [] };
  }
  const badFns = parsed.fns.filter((f) => !ALLOWED_FUNCTIONS.has(f));
  if (badFns.length) {
    return {
      ok: false,
      reason: `Expression uses disallowed function(s): ${badFns.join(", ")}`,
      unknown: badFns,
    };
  }
  const declared = new Set(declaredIds);
  const unknown = parsed.vars.filter(
    (id) => !declared.has(id) && !ALLOWED_CONSTANTS.has(id),
  );
  if (unknown.length) {
    return {
      ok: false,
      reason: `Expression references undeclared identifier(s): ${unknown.join(", ")}`,
      unknown,
    };
  }
  return { ok: true };
}

/** Whole-config gate used by /api/generate before persisting a simulator. */
export function validateSimulatorConfig(config: SimulatorConfig): {
  ok: boolean;
  errors: string[];
} {
  const ids = config.inputs.map((i) => i.id);
  const errors: string[] = [];

  if (new Set(ids).size !== ids.length)
    errors.push("Duplicate input ids in simulator config.");

  for (const out of config.outputs) {
    const v = validateExpression(out.expression, ids);
    if (!v.ok) errors.push(`Output "${out.label}": ${v.reason}`);
    // confirm it actually evaluates at the default values
    const probe = evaluateExpression(
      out.expression,
      Object.fromEntries(config.inputs.map((i) => [i.id, i.default])),
    );
    if (probe === null)
      errors.push(`Output "${out.label}" did not evaluate to a number.`);
  }

  if (config.chart) {
    if (!ids.includes(config.chart.x_input_id))
      errors.push("chart.x_input_id is not a declared input.");
    if (
      config.chart.output_index < 0 ||
      config.chart.output_index >= config.outputs.length
    )
      errors.push("chart.output_index is out of range.");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Evaluate one expression against a scope of { inputId: value }. Returns a
 * finite number, or null if the expression errors or yields a non-number.
 */
export function evaluateExpression(
  expression: string,
  scope: Record<string, number>,
): number | null {
  try {
    // Evaluate on the hardened instance: it parses internally, and any attempt
    // to call a disabled function (import/evaluate/…) throws → null.
    const result = evaluator.evaluate(normalizeExpression(expression), {
      ...scope,
    });
    const n = typeof result === "number" ? result : Number(result);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Convenience: evaluate every output at a given set of input values. */
export function computeOutputs(
  config: SimulatorConfig,
  values: Record<string, number>,
): (number | null)[] {
  return config.outputs.map((o) => evaluateExpression(o.expression, values));
}
