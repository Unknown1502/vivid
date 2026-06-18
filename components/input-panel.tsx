"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ComposingState } from "@/components/states";
import { exampleChips } from "@/lib/samples";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

const MAX = 2000;

export function InputPanel() {
  const router = useRouter();
  const [description, setDescription] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    track("landing_view", {
      referrer: document.referrer || undefined,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
    });
  }, []);

  async function generate(text: string, source: "input" | "chip" = "input") {
    const desc = text.trim();
    if (!desc || loading) return;
    setError(null);
    setLoading(true);
    track("generate_clicked", { source, length: desc.length });
    const generateStart = Date.now();
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description: desc.slice(0, MAX) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.slug) {
        throw new Error(
          data?.error ??
            "We couldn't compose that one. Try rephrasing how it works.",
        );
      }
      track("explainer_generated", {
        slug: data.slug,
        description_length: desc.length,
        source,
        generation_duration_ms: Date.now() - generateStart,
      });
      // keep the composing state up through navigation
      router.push(`/v/${data.slug}`);
    } catch (e: any) {
      track("explainer_generation_failed", {
        error_message: (e?.message ?? "Unknown error").slice(0, 200),
        description_length: desc.length,
        source,
      });
      setError(e?.message ?? "Something went wrong. Try again.");
      setLoading(false);
    }
  }

  if (loading) {
    return <ComposingState />;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          generate(description);
        }}
        className="relative"
      >
        <Textarea
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX))}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              generate(description);
            }
          }}
          placeholder="Describe how something works…  e.g. our activation funnel where 60% drop after signup"
          rows={3}
          className="pb-16 text-lg"
        />
        <div className="absolute bottom-3 left-4 right-3 flex items-center justify-between">
          <span className="tabular text-xs text-muted-foreground/70">
            {description.length > 0 ? `${description.length}/${MAX}` : "⌘↵ to ship"}
          </span>
          <Button type="submit" size="lg" disabled={!description.trim()}>
            <Sparkles className="h-4 w-4" />
            Make it Vivid
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {error && (
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-2.5 text-sm text-warn">
          {error}
        </p>
      )}

      {/* Example chips — each hits a DIFFERENT template */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="mr-1 text-xs text-muted-foreground">Try:</span>
        {exampleChips.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              track("example_chip_used", { chip: chip.label });
              setDescription(chip.description);
              generate(chip.description, "chip");
            }}
            className={cn(
              "rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur transition-all hover:border-primary/50 hover:text-foreground active:scale-95",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
