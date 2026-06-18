"use client";

import * as React from "react";
import type { SimulatorConfig } from "@/lib/schemas";
import { computeOutputs, evaluateExpression } from "@/lib/evaluate";
import { cn, formatNumber } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui-kit/animated-number";
import { Knob } from "@/components/ui-kit/knob";
import { SectionLabel, TemplateHint } from "@/components/ui-kit/template-chrome";

function formatValue(n: number | null, unit?: string): string {
  if (n === null || !isFinite(n)) return "—";
  const body = formatNumber(n, { decimals: 2 });
  if (unit === "$" || unit === "€" || unit === "£") return `${unit}${body}`;
  return unit ? `${body} ${unit}` : body;
}

/** Tiny inline area chart: one output across one input's range. */
function MiniChart({
  config,
  values,
  xId,
  outputIndex,
}: {
  config: SimulatorConfig;
  values: Record<string, number>;
  xId: string;
  outputIndex: number;
}) {
  const W = 600;
  const H = 180;
  const PAD = 8;
  const input = config.inputs.find((i) => i.id === xId);
  const output = config.outputs[outputIndex];
  const samples = React.useMemo(() => {
    if (!input || !output) return [];
    const N = 48;
    const pts: { x: number; y: number }[] = [];
    for (let k = 0; k <= N; k++) {
      const xv = input.min + ((input.max - input.min) * k) / N;
      const y = evaluateExpression(output.expression, { ...values, [xId]: xv });
      if (y !== null) pts.push({ x: xv, y });
    }
    return pts;
  }, [config, values, xId, outputIndex, input, output]);

  if (!input || !output || samples.length < 2) return null;

  const ys = samples.map((s) => s.y);
  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys);
  const xMin = input.min;
  const xMax = input.max;
  const px = (x: number) =>
    PAD + ((x - xMin) / (xMax - xMin || 1)) * (W - 2 * PAD);
  const py = (y: number) =>
    H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - 2 * PAD);

  const line = samples
    .map((s, i) => `${i === 0 ? "M" : "L"} ${px(s.x)} ${py(s.y)}`)
    .join(" ");
  const area = `${line} L ${px(xMax)} ${H - PAD} L ${px(xMin)} ${H - PAD} Z`;

  const curX = values[xId];
  const curY = evaluateExpression(output.expression, values);

  return (
    <div className="mt-2">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`${output.label} vs ${input.label}`}
      >
        <defs>
          <linearGradient id="simfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#simfill)" />
        <path
          d={line}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        {curY !== null && (
          <>
            <line
              x1={px(curX)}
              y1={PAD}
              x2={px(curX)}
              y2={H - PAD}
              stroke="hsl(var(--primary))"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.5}
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={px(curX)}
              cy={py(curY)}
              r={5}
              fill="hsl(var(--primary))"
              style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary)))" }}
            />
          </>
        )}
      </svg>
      <div className="mt-1 flex justify-between text-[0.7rem] text-muted-foreground">
        <span>
          {input.label}: {formatNumber(xMin)}
        </span>
        <span>{formatNumber(xMax)}</span>
      </div>
    </div>
  );
}

export function SimulatorTemplate({ config }: { config: SimulatorConfig }) {
  const [values, setValues] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(config.inputs.map((i) => [i.id, i.default])),
  );

  const setValue = (id: string, v: number) =>
    setValues((prev) => ({ ...prev, [id]: v }));

  const reset = () =>
    setValues(Object.fromEntries(config.inputs.map((i) => [i.id, i.default])));

  const outputs = computeOutputs(config, values);

  return (
    <div>
      <TemplateHint>
        Move the sliders — every output recomputes live from the formula (safely
        evaluated, never eval).
      </TemplateHint>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div>
          <div className="flex items-center justify-between">
            <SectionLabel className="mb-0">Inputs</SectionLabel>
            <button
              onClick={reset}
              data-testid="vivid-reset"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="mt-3 space-y-5 rounded-2xl border border-border/70 bg-card/40 p-5">
            {config.inputs.map((input) => (
              <Knob
                key={input.id}
                label={input.label}
                value={values[input.id]}
                display={formatValue(values[input.id], input.unit)}
                min={input.min}
                max={input.max}
                step={input.step}
                onChange={(v) => setValue(input.id, v)}
              />
            ))}
          </div>
        </div>

        {/* Outputs */}
        <div>
          <SectionLabel>Outputs</SectionLabel>
          <div className="space-y-3">
            {config.outputs.map((out, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/70 bg-card/40 p-5"
              >
                <div className="kicker mb-1">{out.label}</div>
                <div className="font-display text-3xl leading-none text-primary sm:text-4xl">
                  <AnimatedNumber
                    value={outputs[i] ?? 0}
                    format={(n) => formatValue(n, out.unit)}
                  />
                </div>
                <div className="mt-1 font-mono text-[0.7rem] text-muted-foreground/70">
                  = {out.expression}
                </div>
              </div>
            ))}
          </div>

          {config.chart && (
            <div className="mt-3 rounded-2xl border border-border/70 bg-card/40 p-5">
              <div className="kicker mb-1">
                {config.outputs[config.chart.output_index]?.label} vs{" "}
                {config.inputs.find((i) => i.id === config.chart!.x_input_id)
                  ?.label}
              </div>
              <MiniChart
                config={config}
                values={values}
                xId={config.chart.x_input_id}
                outputIndex={config.chart.output_index}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
