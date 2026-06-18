import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Quote } from "lucide-react";
import { Wordmark } from "@/components/wordmark";
import { ShareBar } from "@/components/share-bar";
import { TemplateRenderer } from "@/components/template-renderer";
import { TrackRender } from "@/components/track-render";
import { PulseBar } from "@/components/pulse-bar";
import { ImproveButton } from "@/components/improve-button";
import { Button } from "@/components/ui/button";
import { getExplainer, getPulse } from "@/lib/db";

export const dynamic = "force-dynamic";

const TEMPLATE_LABEL: Record<string, string> = {
  funnel: "Funnel",
  flow: "Flow",
  system: "System",
  tradeoff: "Tradeoff",
  simulator: "Simulator",
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const record = await getExplainer(params.slug);
  if (!record) return { title: "Explainer not found" };
  const title = record.config.title;
  const label = TEMPLATE_LABEL[record.template_id] ?? "";
  const ogUrl = `/api/og/${params.slug}?title=${encodeURIComponent(
    title,
  )}&tpl=${encodeURIComponent(label)}`;
  return {
    title,
    description: `An interactive ${label} explainer — made with Vivid.`,
    openGraph: {
      title,
      description: "Interactive explainer · poke it, then share it.",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      images: [ogUrl],
    },
  };
}

export default async function ExplainerPage({
  params,
}: {
  params: { slug: string };
}) {
  const record = await getExplainer(params.slug);
  if (!record) notFound();
  const pulse = await getPulse(params.slug);

  return (
    <main className="relative pb-20">
      <TrackRender template={record.template_id} slug={record.slug} />
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <Wordmark />
        <Button asChild variant="secondary" size="sm">
          <Link href="/">
            Make your own <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="container max-w-5xl">
        {/* Source description */}
        <div className="mb-6 flex items-start gap-3">
          <Quote className="mt-1 h-5 w-5 shrink-0 text-primary/70" />
          <div>
            <div className="kicker mb-1">You described</div>
            <p className="max-w-2xl text-pretty text-lg leading-snug text-foreground/90">
              {record.description}
            </p>
          </div>
        </div>

        {/* Share bar */}
        <div className="mb-6">
          <ShareBar slug={record.slug} title={record.config.title} />
        </div>

        {/* The interactive explainer (renderer adds its own frame + hint) */}
        <div data-vivid-context="explainer">
          <TemplateRenderer config={record.config} />
        </div>

        {/* Novus dogfood: real interaction pulse + a tiny improve agent */}
        <div className="mt-5 flex flex-col gap-3">
          <PulseBar pulse={pulse} />
          <ImproveButton slug={record.slug} />
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/40 p-6 text-center sm:flex-row sm:text-left">
          <div>
            <div className="font-display text-xl">Have something to explain?</div>
            <p className="text-sm text-muted-foreground">
              One sentence in. An interactive, shareable explainer out.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/">
              Make it Vivid <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
