import * as React from "react";
import { cn } from "@/lib/utils";
import type { TemplateId } from "@/lib/schemas";
import {
  BarChart3,
  GitBranch,
  Network,
  Scale,
  SlidersHorizontal,
} from "lucide-react";

/** Per-template identity used by the chrome + renderer for a coherent kit. */
export const TEMPLATE_META: Record<
  TemplateId,
  { name: string; icon: React.ComponentType<{ className?: string }>; verb: string }
> = {
  funnel: { name: "Funnel", icon: BarChart3, verb: "Drag the stages" },
  flow: { name: "Flow", icon: GitBranch, verb: "Step through it" },
  system: { name: "System", icon: Network, verb: "Watch the request — knock a node out" },
  tradeoff: { name: "Tradeoff", icon: Scale, verb: "Move the weights" },
  simulator: { name: "Simulator", icon: SlidersHorizontal, verb: "Move the sliders" },
};

/**
 * The shared editorial frame every template renders inside, so all five feel
 * like one product: a kicker (template kind), the title, then the interactive.
 */
export function TemplateFrame({
  template,
  title,
  children,
  className,
}: {
  template: TemplateId;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const meta = TEMPLATE_META[template];
  const Icon = meta.icon;
  return (
    <section className={cn("panel grain overflow-hidden", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border/70 p-5 sm:p-6">
        <div className="min-w-0">
          <div className="kicker flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-primary" />
            {meta.name} explainer
          </div>
          <h2 className="mt-2 font-display text-2xl leading-tight tracking-tight sm:text-3xl">
            {title}
          </h2>
        </div>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

/** "What to try" hint shown under the title bar. */
export function TemplateHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
      </span>
      {children}
    </p>
  );
}

/** Small uppercase section label used inside templates. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("kicker mb-3", className)}>{children}</div>;
}
