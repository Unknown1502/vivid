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
    return () => {
      if ((window as any).__vividSlug === slug)
        delete (window as any).__vividSlug;
    };
  }, [template, slug]);
  return null;
}
