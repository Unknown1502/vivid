"use client";

import * as React from "react";
import { animate, useMotionValue } from "framer-motion";

/**
 * A number that eases/counts to its value (vivid_build_spec.md §8 motion).
 * Updates the DOM node directly so it stays smooth without re-rendering React.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  duration = 0.6,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(value);
  const formatRef = React.useRef(format);
  formatRef.current = format;

  React.useEffect(() => {
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = formatRef.current(v);
    });
    return unsub;
  }, [mv]);

  React.useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [value, duration, mv]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
}
