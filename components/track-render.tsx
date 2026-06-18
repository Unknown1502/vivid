"use client";

import * as React from "react";
import { track } from "@/lib/analytics";

/**
 * Fires `explainer_rendered` once when a /v/[slug] page mounts, and publishes
 * the current slug so knob/share events attribute to this explainer's Pulse.
 */
export function TrackRender({
  template,
  slug,
}: {
  template: string;
  slug: string;
}) {
  React.useEffect(() => {
    (window as any).__vividSlug = slug;
    track("explainer_rendered", { template, slug });
    // Attach the most-recently-viewed template type to the visitor profile
    // so Novus segments can filter by template_preference.
    const w = window as any;
    if (w.pendo?.updateOptions) {
      w.pendo.updateOptions({ visitor: { template_preference: template } });
    }
    return () => {
      if ((window as any).__vividSlug === slug)
        delete (window as any).__vividSlug;
    };
  }, [template, slug]);
  return null;
}
