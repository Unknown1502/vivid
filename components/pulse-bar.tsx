import { Eye, Hand, Share2, Activity } from "lucide-react";
import type { Pulse } from "@/lib/db";

/**
 * The Novus dogfood, surfaced in-product: a real, honest aggregate of the same
 * funnel signal Vivid sends Novus. Shows whether viewers actually *poke* the
 * explainer — the core value moment — not just that they looked at it.
 */
export function PulseBar({ pulse }: { pulse: Pulse }) {
  const { views, interactions, shares } = pulse;
  const rate = views > 0 ? Math.round((interactions / views) * 100) : 0;
  const fresh = views === 0;

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-border/70 bg-card/40 px-5 py-3 text-sm">
      <span className="kicker flex items-center gap-1.5">
        <Activity className="h-3.5 w-3.5 text-primary" />
        Live pulse
      </span>

      {fresh ? (
        <span className="text-muted-foreground">
          No views yet — you&rsquo;re the first. Poke a knob and watch it count.
        </span>
      ) : (
        <>
          <Stat icon={Eye} value={views} label="views" />
          <Stat icon={Hand} value={interactions} label="poked it" />
          <Stat icon={Share2} value={shares} label="shared" />
          <span className="flex items-center gap-1.5">
            <span
              className="tabular font-semibold"
              style={{
                color:
                  rate >= 50
                    ? "hsl(var(--good))"
                    : rate >= 25
                      ? "hsl(var(--warn))"
                      : "hsl(var(--bad))",
              }}
            >
              {rate}%
            </span>
            <span className="text-muted-foreground">actually interacted</span>
          </span>
        </>
      )}

      <span className="ml-auto hidden text-xs text-muted-foreground/70 sm:block">
        same signal we stream to Novus
      </span>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="tabular font-semibold text-foreground">
        {value.toLocaleString()}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
