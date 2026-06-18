import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Compact human number: 1,240 / 12.4K / 3.1M. */
export function formatNumber(n: number, opts?: { decimals?: number }): string {
  if (!isFinite(n)) return "—";
  const decimals = opts?.decimals ?? 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000)
    return `${trim(n / 1_000_000)}M`;
  if (abs >= 10_000) return `${trim(n / 1_000)}K`;
  return n.toLocaleString(undefined, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

function trim(n: number) {
  return (Math.round(n * 10) / 10).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

export function formatPercent(fraction: number, decimals = 1): string {
  return `${(fraction * 100).toLocaleString(undefined, {
    maximumFractionDigits: decimals,
  })}%`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Reserved positive→warning ramp. t in [0,1]: 1 = good (kept), 0 = bad (lost).
 * Returns an `hsl(...)` string interpolated good → warn → bad. Used only for
 * funnel pass-through severity and node-down state so the color reads instantly.
 */
export function severityColor(t: number, alpha = 1): string {
  const x = clamp(t, 0, 1);
  // anchor HSLs (must mirror --good / --warn / --bad in globals.css)
  const good = [152, 62, 47];
  const warn = [38, 94, 56];
  const bad = [358, 78, 60];
  let h: number, s: number, l: number;
  if (x >= 0.5) {
    const k = (x - 0.5) / 0.5; // warn -> good
    [h, s, l] = warn.map((v, i) => lerp(v, good[i], k)) as [
      number,
      number,
      number,
    ];
  } else {
    const k = x / 0.5; // bad -> warn
    [h, s, l] = bad.map((v, i) => lerp(v, warn[i], k)) as [
      number,
      number,
      number,
    ];
  }
  return `hsl(${h.toFixed(0)} ${s.toFixed(0)}% ${l.toFixed(0)}% / ${alpha})`;
}
