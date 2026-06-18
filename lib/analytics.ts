/**
 * Vivid product analytics — the Novus funnel (vivid_build_spec.md §9).
 *
 *   landing_view → generate_clicked → explainer_rendered → knob_interacted
 *                → explainer_shared   (+ example_chip_used)
 *
 * `track()` is provider-agnostic: it feeds whatever Novus exposes on `window`
 * (Novus auto-instruments page views via the deploy integration; custom events
 * go through its JS API if present), and always pushes to a window buffer +
 * a DOM CustomEvent so nothing is ever lost and the funnel is inspectable.
 */

export type VividEvent =
  | "landing_view"
  | "generate_clicked"
  | "explainer_rendered"
  | "knob_interacted"
  | "explainer_shared"
  | "example_chip_used"
  | "explainer_generated"
  | "explainer_generation_failed"
  | "coach_suggestion_received";

type Props = Record<string, string | number | boolean | undefined>;

export function track(event: VividEvent, props: Props = {}): void {
  if (typeof window === "undefined") return;
  const w = window as any;
  const payload = { ...props, ts: Date.now() };
  try {
    // Pendo — Novus instruments via Pendo, so feed its track API when present.
    if (w.pendo?.track) w.pendo.track(event, payload);

    // Sponsor analytics (Novus) — try the common shapes of its client API.
    const novus = w.novus ?? w.Novus;
    if (novus?.track) novus.track(event, payload);
    else if (typeof novus === "function") novus("track", event, payload);

    // Generic dataLayer (works if a GTM/Segment-style sink is installed).
    if (Array.isArray(w.dataLayer)) w.dataLayer.push({ event, ...payload });

    // Always: an inspectable buffer + a DOM event for any listener.
    (w.__vividEvents ??= []).push({ event, ...payload });
    window.dispatchEvent(new CustomEvent(`vivid:${event}`, { detail: payload }));

    // Dogfood: feed our own per-explainer Pulse for the events that map to it.
    const slug: string | undefined = (props.slug as string) ?? w.__vividSlug;
    if (
      slug &&
      (event === "explainer_rendered" ||
        event === "knob_interacted" ||
        event === "explainer_shared")
    ) {
      const body = JSON.stringify({ slug, event });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/track", body);
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    }

    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug(`[vivid] ${event}`, props);
    }
  } catch {
    /* never let analytics break the app */
  }
}

const fired = new Set<string>();
/** Fire an event at most once per page load (e.g. first knob touch). */
export function trackOnce(event: VividEvent, props: Props = {}): void {
  const key = event + JSON.stringify(props);
  if (fired.has(event)) return;
  fired.add(event);
  fired.add(key);
  track(event, props);
}
