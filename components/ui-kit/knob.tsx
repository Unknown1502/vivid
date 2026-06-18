"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { trackOnce } from "@/lib/analytics";

/**
 * A labeled slider row — the shared control across funnel / tradeoff /
 * simulator. Label on the left, live value on the right, slider beneath.
 */
export function Knob({
  label,
  value,
  display,
  min,
  max,
  step,
  accent,
  onChange,
  sublabel,
  className,
}: {
  label: React.ReactNode;
  value: number;
  display: React.ReactNode;
  min: number;
  max: number;
  step: number;
  accent?: string;
  onChange: (v: number) => void;
  sublabel?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group", className)}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="truncate text-sm font-medium text-foreground">
          {label}
        </span>
        <span
          className="tabular shrink-0 text-sm font-semibold"
          style={{ color: accent ?? "hsl(var(--primary))" }}
        >
          {display}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        accent={accent}
        onValueChange={(v) => {
          trackOnce("knob_interacted", {
            slug: (window as any).__vividSlug,
            knob_label: typeof label === "string" ? label : undefined,
          });
          onChange(v[0]);
        }}
        aria-label={typeof label === "string" ? label : undefined}
      />
      {sublabel ? (
        <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>
      ) : null}
    </div>
  );
}
