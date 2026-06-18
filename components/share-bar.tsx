"use client";

import * as React from "react";
import { Check, Link2, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

/** Copy-link share bar for /v/[slug]. React state only — no storage. */
export function ShareBar({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = React.useState(false);
  const [url, setUrl] = React.useState("");

  React.useEffect(() => {
    setUrl(`${window.location.origin}/v/${slug}`);
  }, [slug]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url || `/v/${slug}`);
      setCopied(true);
      track("explainer_shared", { slug, method: "copy" });
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `${title} — an interactive explainer made with Vivid`,
  )}&url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm backdrop-blur">
        <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-muted-foreground">
          {url || `…/v/${slug}`}
        </span>
      </div>
      <Button onClick={copy} variant={copied ? "secondary" : "default"}>
        {copied ? (
          <>
            <Check className="h-4 w-4" /> Copied
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4" /> Copy link
          </>
        )}
      </Button>
      <Button asChild variant="ghost" size="icon" aria-label="Share on X">
        <a href={tweet} target="_blank" rel="noopener noreferrer">
          <Twitter className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}
