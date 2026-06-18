"use client";

import * as React from "react";
import { animate, motionValue } from "framer-motion";
import {
  Monitor,
  Server,
  Database,
  Globe,
  Power,
  Zap,
  AlertTriangle,
} from "lucide-react";
import type { SystemConfig } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SectionLabel, TemplateHint } from "@/components/ui-kit/template-chrome";
import { trackOnce } from "@/lib/analytics";

type Pt = { x: number; y: number };

const NODE_W = 156;
const NODE_H = 62;
const VIEW_W = 1000;

const TYPE_META = {
  client: { icon: Monitor, label: "client" },
  service: { icon: Server, label: "service" },
  datastore: { icon: Database, label: "datastore" },
  external: { icon: Globe, label: "external" },
} as const;

/** Animate a packet along the reachable path; updates the circle via ref. */
function useRequestPulse(points: Pt[]) {
  const ref = React.useRef<SVGCircleElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (points.length < 2) {
      el.style.opacity = "0";
      return;
    }
    const segs = points.length - 1;
    const mv = motionValue(0);
    const place = (p: number) => {
      const c = Math.max(0, Math.min(segs, p));
      const i = Math.min(segs - 1, Math.floor(c));
      const f = c - i;
      const a = points[i];
      const b = points[i + 1];
      el.setAttribute("cx", String(a.x + (b.x - a.x) * f));
      el.setAttribute("cy", String(a.y + (b.y - a.y) * f));
    };
    place(0);
    el.style.opacity = "1";
    const unsub = mv.on("change", place);
    const controls = animate(mv, segs, {
      duration: Math.max(1.1, 0.85 * segs),
      ease: "linear",
      repeat: Infinity,
      repeatType: "loop",
      repeatDelay: 0.7,
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [points]);
  return ref;
}

export function SystemTemplate({ config }: { config: SystemConfig }) {
  const [down, setDown] = React.useState<Set<string>>(new Set());

  const toggleDown = (id: string) => {
    trackOnce("knob_interacted", {
      slug: (window as any).__vividSlug,
      template: "system",
    });
    setDown((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Layout: request_path on a top spine, off-path nodes on a lower row ──
  // Canvas width grows with the busiest row so node boxes can NEVER overlap,
  // however many nodes the model returns. The SVG scales to its container and
  // scrolls horizontally on small screens.
  const { pos, width, height } = React.useMemo(() => {
    const pathUnique: string[] = [];
    for (const id of config.request_path)
      if (!pathUnique.includes(id)) pathUnique.push(id);
    const offPath = config.nodes
      .map((n) => n.id)
      .filter((id) => !pathUnique.includes(id));

    const GAP = 56;
    const rowCount = Math.max(pathUnique.length, offPath.length, 1);
    const width = Math.max(VIEW_W, rowCount * (NODE_W + GAP));
    const m = NODE_W / 2 + 28; // keep first/last boxes fully on-canvas

    const rowX = (i: number, k: number) =>
      k <= 1 ? width / 2 : m + ((width - 2 * m) * i) / (k - 1);

    const p: Record<string, Pt> = {};
    const y1 = 80;
    const y2 = 232;
    pathUnique.forEach((id, i) => {
      p[id] = { x: rowX(i, pathUnique.length), y: y1 };
    });
    offPath.forEach((id, i) => {
      p[id] = { x: rowX(i, offPath.length), y: y2 };
    });
    return { pos: p, width, height: offPath.length ? 300 : 168 };
  }, [config]);

  // first down node on the path breaks everything downstream
  const brokenIndex = React.useMemo(
    () => config.request_path.findIndex((id) => down.has(id)),
    [config.request_path, down],
  );
  const isBroken = brokenIndex !== -1;

  const reachableIds = isBroken
    ? config.request_path.slice(0, brokenIndex)
    : config.request_path;
  const pulsePoints = reachableIds
    .map((id) => pos[id])
    .filter(Boolean) as Pt[];
  const pulseRef = useRequestPulse(pulsePoints);

  const breakPt = isBroken ? pos[config.request_path[brokenIndex]] : null;

  // earliest path index a node occupies (for dimming the unreached tail)
  const pathIndexOf = (id: string) => config.request_path.indexOf(id);

  const nodeById = React.useMemo(
    () => Object.fromEntries(config.nodes.map((n) => [n.id, n])),
    [config.nodes],
  );

  return (
    <div>
      <TemplateHint>
        Watch the request travel the path. Tap any node to knock it offline and
        see what breaks.
      </TemplateHint>

      {/* Status line */}
      <div
        className={cn(
          "mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm",
          isBroken
            ? "border-bad/40 bg-bad/10 text-bad"
            : "border-good/30 bg-good/5 text-good",
        )}
      >
        {isBroken ? (
          <>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-foreground/90">
              Request fails at{" "}
              <strong className="text-bad">
                {nodeById[config.request_path[brokenIndex]]?.label}
              </strong>{" "}
              — everything downstream is unreachable.
            </span>
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 shrink-0" />
            <span className="text-foreground/90">
              Healthy — a request flows{" "}
              {config.request_path
                .map((id) => nodeById[id]?.label ?? id)
                .join(" → ")}
              .
            </span>
          </>
        )}
      </div>

      {/* Diagram */}
      <div className="no-scrollbar overflow-x-auto rounded-2xl border border-border/70 bg-card/30 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="block h-auto w-full min-w-[680px]"
          role="img"
          aria-label={config.title}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
            </marker>
          </defs>

          {/* Edges */}
          {config.edges.map((e, i) => {
            const a = pos[e.from];
            const b = pos[e.to];
            if (!a || !b) return null;
            // is this a consecutive hop on the request path?
            let hopState: "idle" | "active" | "broken" = "idle";
            for (let k = 0; k < config.request_path.length - 1; k++) {
              if (
                config.request_path[k] === e.from &&
                config.request_path[k + 1] === e.to
              ) {
                hopState =
                  isBroken && k + 1 >= brokenIndex ? "broken" : "active";
                break;
              }
            }
            const stroke =
              hopState === "broken"
                ? "hsl(var(--bad))"
                : hopState === "active"
                  ? "hsl(var(--primary))"
                  : "hsl(var(--border))";
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - (a.y === b.y ? 0 : 18);
            return (
              <g key={i}>
                <path
                  d={`M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={hopState === "idle" ? 1.5 : 2.5}
                  strokeDasharray={hopState === "broken" ? "6 6" : undefined}
                  markerEnd="url(#arrow)"
                  opacity={hopState === "idle" ? 0.6 : 1}
                />
                {e.label && (
                  <text
                    x={mx}
                    y={my - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground"
                    style={{ fontSize: 11 }}
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Request packet */}
          <circle
            ref={pulseRef}
            r={7}
            fill="hsl(var(--primary))"
            style={{
              filter: "drop-shadow(0 0 8px hsl(var(--primary)))",
              opacity: 0,
            }}
          />

          {/* Break marker */}
          {breakPt && (
            <g>
              <circle
                cx={breakPt.x}
                cy={breakPt.y}
                r={16}
                fill="none"
                stroke="hsl(var(--bad))"
                strokeWidth={2}
                className="animate-pulse-soft"
              />
            </g>
          )}

          {/* Nodes (HTML via foreignObject so labels wrap + click nicely) */}
          {config.nodes.map((node) => {
            const p = pos[node.id];
            if (!p) return null;
            const meta = TYPE_META[node.type];
            const Icon = meta.icon;
            const isDown = down.has(node.id);
            const idx = pathIndexOf(node.id);
            const unreached =
              isBroken && idx !== -1 && idx > brokenIndex && !isDown;
            const onPath = idx !== -1;
            return (
              <foreignObject
                key={node.id}
                x={p.x - NODE_W / 2}
                y={p.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                style={{ overflow: "visible" }}
              >
                <button
                  onClick={() => toggleDown(node.id)}
                  className={cn(
                    "flex h-[62px] w-[156px] items-center gap-2.5 rounded-xl border px-3 text-left transition-all duration-300",
                    isDown
                      ? "border-bad/70 bg-bad/15 text-bad"
                      : onPath
                        ? "border-primary/50 bg-card shadow-glow"
                        : "border-border bg-card",
                    unreached && "opacity-40",
                  )}
                  title={isDown ? "Bring back online" : "Knock offline"}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isDown
                        ? "bg-bad/20 text-bad"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {isDown ? (
                      <Power className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium leading-tight">
                      {node.label}
                    </span>
                    <span className="block text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                      {isDown ? "offline" : meta.label}
                    </span>
                  </span>
                </button>
              </foreignObject>
            );
          })}
        </svg>
      </div>

      {/* Legend + reset */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {(
            Object.keys(TYPE_META) as (keyof typeof TYPE_META)[]
          ).map((t) => {
            const Icon = TYPE_META[t].icon;
            return (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary/80" />
                {TYPE_META[t].label}
              </span>
            );
          })}
        </div>
        {down.size > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setDown(new Set())}>
            Restore all nodes
          </Button>
        )}
      </div>
    </div>
  );
}
