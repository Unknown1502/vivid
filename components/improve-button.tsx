"use client";

import * as React from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * The tiny improve-agent surfaced in-product: asks Vivid to read this
 * explainer's config + real Pulse and suggest one concrete improvement.
 */
export function ImproveButton({ slug }: { slug: string }) {
  const [loading, setLoading] = React.useState(false);
  const [suggestion, setSuggestion] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function ask() {
    setLoading(true);
    setError(null);
    setSuggestion(null);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Couldn't get a suggestion.");
      setSuggestion(data.suggestion);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border/70 bg-card/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Wand2 className="h-4 w-4 text-primary" />
          <span className="font-medium">Coach</span>
          <span className="text-muted-foreground">
            — read the pulse, suggest one improvement
          </span>
        </div>
        <Button variant="secondary" size="sm" onClick={ask} disabled={loading}>
          <Sparkles className="h-4 w-4" />
          {loading ? "Reading the pulse…" : "Improve this explainer"}
        </Button>
      </div>

      {suggestion && (
        <p className="mt-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground/90">
          {suggestion}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">
          {error}
        </p>
      )}
    </div>
  );
}
