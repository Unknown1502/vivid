"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/**
 * Restyled Radix slider — the shared "knob" across funnel, tradeoff and
 * simulator. Touch targets are generous so it works by finger on mobile.
 * Pass `accent` to tint the active track/thumb (e.g. the funnel severity color).
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    accent?: string;
  }
>(({ className, accent, ...props }, ref) => {
  const accentStyle = accent
    ? ({ ["--knob" as any]: accent } as React.CSSProperties)
    : undefined;
  return (
    <SliderPrimitive.Root
      ref={ref}
      style={accentStyle}
      className={cn(
        "relative flex w-full touch-none select-none items-center py-2",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{ background: accent ?? "hsl(var(--primary))" }}
        />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block h-5 w-5 rounded-full border-2 bg-background shadow-md ring-offset-background transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
        style={{ borderColor: accent ?? "hsl(var(--primary))" }}
      />
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
