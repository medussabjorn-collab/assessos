"use client";

import { useRef } from "react";

/**
 * Historically drove a scroll-triggered reveal via IntersectionObserver.
 * Removed: on a throttled/backgrounded tab, the browser can defer painting
 * indefinitely, so anything gated on "wait for the observer, then transition"
 * could stay invisible forever even though the DOM state was correct. Content
 * now always renders at its final, correct state — the ref is kept so
 * consumers don't need to change, but inView is always true.
 */
export function useInView<T extends HTMLElement>(_threshold = 0.25) {
  const ref = useRef<T>(null);
  return { ref, inView: true };
}
