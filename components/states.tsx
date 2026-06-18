"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_LINES = [
  "Reading your description…",
  "Choosing the right template…",
  "Filling in specific numbers…",
  "Wiring up the knobs…",
  "Polishing the pixels…",
];

/** Vivid's own "composing your explainer…" state (it dogfoods its own polish). */
export function ComposingState() {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(
      () => setI((p) => (p + 1) % STATUS_LINES.length),
      1400,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="panel grain mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center">
      <div className="relative mb-6">
        <motion.div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15"
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="h-7 w-7 text-primary" />
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-2xl border border-primary/40"
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      </div>

      <h2 className="font-display text-2xl tracking-tight">
        Composing your explainer
      </h2>

      <div className="mt-2 h-6 text-sm text-muted-foreground">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
          >
            {STATUS_LINES[i]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* shimmer skeleton hinting at a template */}
      <div className="mt-8 w-full max-w-md space-y-3">
        {[88, 70, 54, 40].map((w, idx) => (
          <div
            key={idx}
            className="relative h-7 overflow-hidden rounded-lg bg-muted/60"
            style={{ width: `${w}%` }}
          >
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="panel mx-auto flex max-w-2xl flex-col items-center px-6 py-14 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-warn/15">
        <TriangleAlert className="h-6 w-6 text-warn" />
      </div>
      <h2 className="font-display text-2xl tracking-tight">
        That one slipped through
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {message ??
          "We couldn't compose a clean explainer for that. Try rephrasing — describe how something works, step by step or by the numbers."}
      </p>
      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          <RefreshCcw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}
