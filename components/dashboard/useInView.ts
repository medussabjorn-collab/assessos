"use client";

import { useEffect, useRef, useState } from "react";

/** Adds "in" once the element scrolls into view — drives the .in-suffixed CSS animations. */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return;
    }

    const reveal = (skipTransition: boolean) => {
      if (skipTransition) {
        // Throttled/backgrounded tabs can freeze a CSS transition mid-flight
        // (currentTime stuck forever), leaving the element at its hidden
        // starting state even after "in" lands. Strip transitions so the
        // reveal is an instant style write instead.
        el.style.transition = "none";
        el.querySelectorAll<HTMLElement>("*").forEach((child) => {
          child.style.transition = "none";
        });
      }
      setInView(true);
    };

    let settled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          settled = true;
          reveal(false);
          io.unobserve(el);
        }
      },
      { threshold }
    );
    io.observe(el);

    // Recurring safety net rather than a one-shot check: content scrolled
    // into view *after* a single fallback timeout would otherwise have no
    // second chance to reveal if the observer stays silent or its transition
    // gets stuck. Poll until this element settles, then stop.
    const poll = window.setInterval(() => {
      if (settled) {
        window.clearInterval(poll);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        settled = true;
        reveal(true);
      }
    }, 800);

    return () => {
      io.disconnect();
      window.clearInterval(poll);
    };
  }, [threshold]);

  return { ref, inView };
}
