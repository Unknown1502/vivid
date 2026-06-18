import {
  BarChart3,
  GitBranch,
  Network,
  Scale,
  SlidersHorizontal,
} from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { InputPanel } from "@/components/input-panel";
import { TemplateRenderer } from "@/components/template-renderer";
import { sampleFunnel } from "@/lib/samples";
import { countExplainers } from "@/lib/db";

// Vertical recipes for the wedge: what you explain → the outcome it moves.
const RECIPES = [
  {
    icon: SlidersHorizontal,
    name: "Seat + usage pricing",
    outcome: "Prospects model their own bill — fewer \u201cwhat\u2019ll this cost us?\u201d stalls.",
  },
  {
    icon: BarChart3,
    name: "Trial-to-paid funnel",
    outcome: "See exactly which step leaks — shorten time-to-value.",
  },
  {
    icon: Network,
    name: "Source \u2192 warehouse",
    outcome: "Walk security through the architecture — faster reviews.",
  },
  {
    icon: GitBranch,
    name: "SSO / onboarding flow",
    outcome: "Show enterprise setup step-by-step — fewer onboarding tickets.",
  },
  {
    icon: Scale,
    name: "Build vs buy",
    outcome: "Weight the criteria live — align the room in one meeting.",
  },
];

export default async function LandingPage() {
  const total = await countExplainers();
  const countLabel =
    total > 0
      ? `${total.toLocaleString()} explainer${total === 1 ? "" : "s"} made`
      : "Interactive sales & onboarding explainers";

  return (
    <main className="relative">
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <Wordmark />
        <a
          href="#example"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          See a live example \u2193
        </a>
      </header>

      {/* Hero */}
      <section className="container pt-10 pb-12 text-center sm:pt-16">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          {countLabel}
        </div>

        <h1 className="mx-auto max-w-4xl font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl">
          Stop mis-explaining your product.{" "}
          <span className="text-vivid">Make it pokeable.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted-foreground">
          Pricing, onboarding, architecture, permissions \u2014 describe how your
          SaaS works in one sentence and Vivid builds a live, interactive
          explainer your prospects and new hires actually understand. Shareable
          as a link.
        </p>

        <div className="mt-10">
          <InputPanel />
        </div>
      </section>

      {/* Recipes \u2192 outcomes */}
      <section className="container pb-14">
        <div className="kicker mb-4 text-center">
          Built for the explanations that cost you deals &amp; tickets
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {RECIPES.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.name}
                className="panel flex flex-col gap-2 p-4 transition-colors hover:border-primary/40"
              >
                <Icon className="h-5 w-5 text-primary" />
                <div className="text-sm font-semibold leading-tight">
                  {r.name}
                </div>
                <div className="text-xs leading-snug text-muted-foreground">
                  {r.outcome}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Seeded live example \u2014 interactive on load */}
      <section id="example" className="container scroll-mt-8 pb-20">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="kicker mb-1">Already live \u00b7 no typing required</div>
            <h2 className="font-display text-2xl tracking-tight sm:text-3xl">
              Your trial-to-paid funnel. Go on \u2014 drag the leak.
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground">
            Fully interactive, right here. Every explainer Vivid generates
            behaves exactly like this one.
          </p>
        </div>
        <div data-vivid-context="demo">
          <TemplateRenderer config={sampleFunnel} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-3 py-8 text-sm text-muted-foreground sm:flex-row">
          <Wordmark href={null} className="text-base" />
          <p>Describe it once. Ship an interactive. Watch them poke it.</p>
        </div>
      </footer>
    </main>
  );
}
