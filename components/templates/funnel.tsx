"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { FunnelConfig } from "@/lib/schemas";
import {
  cn,
  formatNumber,
  formatPercent,
  severityColor,
  clamp,
} from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui-kit/animated-number";
import { Knob } from "@/components/ui-kit/knob";
import { SectionLabel, TemplateHint } from "@/components/ui-kit/template-chrome";

function niceCeil(n: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(1, n))));
  return Math.ceil(n / pow) * pow;
}

export function FunnelTemplate({ config }: { config: FunnelConfig }) {
  const topMax = niceCeil(config.top_value * 3);
  const topStep = Math.max(1, Math.round(topMax / 200));

  const [topValue, setTopValue] = React.useState(config.top_value);
  const [rates, setRates] = React.useState<number[]>(
    config.stages.map((s) => s.rate),
  );

  // counts[i] = topValue * Π rate[0..i]
  const counts = React.useMemo(() => {
    const out: number[] = [];
    let running = topValue;
    for (let i = 0; i < rates.length; i++) {
      running = running * rates[i];
      out.push(running);
    }
    return out;
  }, [topValue, rates]);

  const finalCount = counts[counts.length - 1] ?? 0;
  const endToEnd = topValue > 0 ? finalCount / topValue : 0;

  const setRate = (i: number, v: number) =>
    setRates((prev) => prev.map((r, idx) => (idx === i ? clamp(v, 0, 1) : r)));

  const reset = () => {
    setTopValue(config.top_value);
    setRates(config.stages.map((s) => s.rate));
  };

  type Row = {
    label: string;
    value: number;
    rate: number;
    isEntry: boolean;
    note?: string;
  };
  const rows: Row[] = [
    {
      label: `Entered (${config.unit})`,
      value: topValue,
      rate: 1,
      isEntry: true,
    },
    ...config.stages.map((s, i) => ({
      label: s.label,
      value: counts[i],
      rate: rates[i],
      note: s.note,
      isEntry: false,
    })),
  ];

  return (
    <div>
      <TemplateHint>
        Drag any stage&rsquo;s pass-through rate — every downstream count and the
        conversion recompute live.
      </TemplateHint>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Funnel bars */}
        <div className="order-2 lg:order-1">
          <SectionLabel>The funnel</SectionLabel>
          <div className="space-y-2.5">
            {rows.map((row, i) => {
              const widthPct = topValue > 0 ? (row.value / topValue) * 100 : 0;
              const color = row.isEntry
                ? "hsl(var(--primary))"
                : severityColor(row.rate);
              const colorSoft = row.isEntry
                ? "hsl(var(--primary) / 0.7)"
                : severityColor(row.rate, 0.72);
              const prev = i === 0 ? row.value : rows[i - 1].value;
              const lost = prev - row.value;
              return (
                <div key={i}>
                  <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{row.label}</span>
                    <span className="tabular shrink-0 text-muted-foreground">
                      {!row.isEntry && (
                        <span className="mr-2 text-xs" style={{ color }}>
                          {formatPercent(row.rate, 0)} pass
                        </span>
                      )}
                      <AnimatedNumber
                        value={row.value}
                        format={(n) => formatNumber(n)}
                        className="font-semibold text-foreground"
                      />
                    </span>
                  </div>
                  <div className="relative h-9 w-full overflow-hidden rounded-lg bg-muted/60">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-lg"
                      style={{
                        background: `linear-gradient(90deg, ${colorSoft}, ${color})`,
                        boxShadow: `0 0 24px -6px ${color}`,
                      }}
                      animate={{ width: `${clamp(widthPct, 0, 100)}%` }}
                      transition={{ type: "spring", stiffness: 140, damping: 22 }}
                    />
                    {!row.isEntry && lost > 0.5 && (
                      <span className="tabular absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground/80">
                        −{formatNumber(lost)} lost
                      </span>
                    )}
                  </div>
                  {row.isEntry === false && row.note ? (
                    <p className="mt-1 text-xs text-muted-foreground/80">
                      {row.note}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Summary metric */}
          <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4 rounded-2xl border border-border/70 bg-card/40 p-5">
            <div>
              <div className="kicker mb-1">{config.summary_metric}</div>
              <div
                className="font-display text-4xl leading-none sm:text-5xl"
                style={{ color: severityColor(endToEnd) }}
              >
                <AnimatedNumber
                  value={endToEnd * 100}
                  format={(n) => `${n.toFixed(1)}%`}
                />
              </div>
            </div>
            <div>
              <div className="kicker mb-1">Final {config.unit}</div>
              <div className="tabular font-display text-3xl leading-none text-foreground">
                <AnimatedNumber
                  value={finalCount}
                  format={(n) => formatNumber(n)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="order-1 lg:order-2">
          <div className="flex items-center justify-between">
            <SectionLabel className="mb-0">Knobs</SectionLabel>
            <button
              onClick={reset}
              data-testid="vivid-reset"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="mt-3 space-y-5 rounded-2xl border border-border/70 bg-card/40 p-5">
            <Knob
              label={`Top of funnel`}
              value={topValue}
              display={formatNumber(topValue)}
              min={0}
              max={topMax}
              step={topStep}
              onChange={(v) => setTopValue(Math.round(v))}
              sublabel={`${config.unit} entering the funnel`}
            />
            <div className="hairline h-px" />
            {config.stages.map((s, i) => (
              <Knob
                key={i}
                label={s.label}
                value={rates[i]}
                display={formatPercent(rates[i], 0)}
                min={0}
                max={1}
                step={0.01}
                accent={severityColor(rates[i])}
                onChange={(v) => setRate(i, v)}
                sublabel="pass-through rate"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
