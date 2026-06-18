"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { TradeoffConfig } from "@/lib/schemas";
import { cn, formatPercent } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui-kit/animated-number";
import { Knob } from "@/components/ui-kit/knob";
import { SectionLabel, TemplateHint } from "@/components/ui-kit/template-chrome";

export function TradeoffTemplate({ config }: { config: TradeoffConfig }) {
  const [weights, setWeights] = React.useState<number[]>(
    config.criteria.map((c) => c.weight),
  );

  const setWeight = (i: number, v: number) =>
    setWeights((prev) => prev.map((w, idx) => (idx === i ? v : w)));

  const weightSum = weights.reduce((a, b) => a + b, 0);
  const normWeights = weights.map((w) =>
    weightSum > 0 ? w / weightSum : 1 / weights.length,
  );

  // weighted total per option (0..10)
  const totals = config.options.map((_, optIdx) =>
    config.criteria.reduce(
      (sum, c, ci) => sum + normWeights[ci] * (c.scores[optIdx] ?? 0),
      0,
    ),
  );

  const ranked = config.options
    .map((name, i) => ({ name, total: totals[i], optIdx: i }))
    .sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(...totals, 0.0001);

  const reset = () => setWeights(config.criteria.map((c) => c.weight));

  return (
    <div>
      <TemplateHint>
        Move each criterion&rsquo;s weight — the scores re-rank and the winner
        re-sorts live. Weights are normalized for you.
      </TemplateHint>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Ranking */}
        <div className="order-2 lg:order-1">
          <SectionLabel>Ranking</SectionLabel>
          <div className="space-y-3">
            {ranked.map((row, rank) => {
              const isWinner = rank === 0 && ranked.length > 1;
              return (
                <motion.div
                  key={row.name}
                  layout
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  className={cn(
                    "rounded-2xl border p-4",
                    isWinner
                      ? "border-primary/60 bg-primary/5 shadow-glow"
                      : "border-border/70 bg-card/40",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          isWinner
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {rank + 1}
                      </span>
                      <span className="truncate font-medium">{row.name}</span>
                      {isWinner && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary">
                          <Trophy className="h-3 w-3" /> Winner
                        </span>
                      )}
                    </div>
                    <span className="tabular shrink-0 font-display text-xl">
                      <AnimatedNumber
                        value={row.total}
                        format={(n) => n.toFixed(2)}
                      />
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        isWinner ? "bg-primary" : "bg-muted-foreground/50",
                      )}
                      style={
                        isWinner
                          ? { boxShadow: "0 0 18px -2px hsl(var(--primary))" }
                          : undefined
                      }
                      animate={{ width: `${(row.total / maxTotal) * 100}%` }}
                      transition={{ type: "spring", stiffness: 160, damping: 24 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Weights */}
        <div className="order-1 lg:order-2">
          <div className="flex items-center justify-between">
            <SectionLabel className="mb-0">Criteria weights</SectionLabel>
            <button
              onClick={reset}
              data-testid="vivid-reset"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="mt-3 space-y-5 rounded-2xl border border-border/70 bg-card/40 p-5">
            {config.criteria.map((c, i) => (
              <Knob
                key={i}
                label={c.name}
                value={weights[i]}
                display={formatPercent(normWeights[i], 0)}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => setWeight(i, v)}
                sublabel="normalized weight"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
