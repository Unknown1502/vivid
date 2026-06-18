"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CornerDownRight } from "lucide-react";
import type { FlowConfig } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionLabel, TemplateHint } from "@/components/ui-kit/template-chrome";
import { trackOnce } from "@/lib/analytics";

export function FlowTemplate({ config }: { config: FlowConfig }) {
  const steps = config.steps;
  const vertical = config.orientation === "vertical";
  const [active, setActive] = React.useState(0);
  const nodeRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    nodeRefs.current[active]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  const go = (i: number) => {
    trackOnce("knob_interacted", {
      slug: (window as any).__vividSlug,
      template: "flow",
    });
    setActive((prev) => Math.min(steps.length - 1, Math.max(0, i ?? prev)));
  };

  const current = steps[active];
  const idToIndex = React.useMemo(
    () => Object.fromEntries(steps.map((s, i) => [s.id, i])),
    [steps],
  );

  return (
    <div>
      <TemplateHint>
        Step through with Next / Prev, or tap any step to jump and expand its
        detail.
      </TemplateHint>

      {/* Rail */}
      <div className="flex items-center justify-between">
        <SectionLabel className="mb-0">The sequence</SectionLabel>
        <span className="tabular text-xs text-muted-foreground">
          Step {active + 1} / {steps.length}
        </span>
      </div>

      <div
        className={cn(
          "no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-2",
          vertical ? "flex-col" : "flex-row items-stretch",
        )}
      >
        {steps.map((step, i) => {
          const state =
            i === active ? "active" : i < active ? "done" : "todo";
          return (
            <React.Fragment key={step.id}>
              <button
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
                onClick={() => go(i)}
                className={cn(
                  "group relative shrink-0 rounded-xl border p-3 text-left transition-all duration-300",
                  vertical ? "w-full" : "w-[170px]",
                  state === "active" &&
                    "border-primary/70 bg-primary/10 shadow-glow",
                  state === "done" && "border-primary/30 bg-card/60",
                  state === "todo" &&
                    "border-border/70 bg-card/30 opacity-70 hover:opacity-100",
                )}
              >
                <span
                  className={cn(
                    "tabular mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    state === "todo"
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="line-clamp-2 text-sm font-medium leading-snug">
                  {step.label}
                </div>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "flex shrink-0 items-center justify-center text-muted-foreground/50",
                    vertical ? "h-3 w-full rotate-90" : "w-3",
                  )}
                >
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Detail */}
      <div className="mt-5 min-h-[160px] rounded-2xl border border-border/70 bg-card/40 p-5 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: vertical ? 0 : 24, y: vertical ? 12 : 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: vertical ? 0 : -24, y: vertical ? -12 : 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="kicker mb-2">Step {active + 1}</div>
            <h3 className="font-display text-2xl tracking-tight">
              {current.label}
            </h3>
            <p className="mt-2 max-w-prose text-[0.95rem] leading-relaxed text-muted-foreground">
              {current.detail}
            </p>

            {current.branches && current.branches.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="kicker">Branches</div>
                {current.branches.map((b, bi) => {
                  const targetIdx = idToIndex[b.to];
                  const target = steps[targetIdx];
                  return (
                    <button
                      key={bi}
                      disabled={target === undefined}
                      onClick={() => target && go(targetIdx)}
                      className="flex w-full items-center gap-2 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 text-left text-sm text-foreground/90 transition-colors hover:border-warn/60 hover:bg-warn/10 disabled:opacity-50"
                    >
                      <CornerDownRight className="h-4 w-4 shrink-0 text-warn" />
                      <span>
                        <span className="text-muted-foreground">if</span>{" "}
                        {b.condition}{" "}
                        <span className="text-muted-foreground">→</span>{" "}
                        <span className="font-medium">
                          {target ? target.label : b.to}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => go(active - 1)}
          disabled={active === 0}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
        <div className="flex flex-1 items-center gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= active ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
        <Button
          onClick={() => go(active + 1)}
          disabled={active === steps.length - 1}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
