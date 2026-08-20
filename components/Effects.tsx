"use client";

import { useEffect } from "react";

/** Scroll reveals, scorecard meter fill, and composite count-up. Renders nothing. */
export default function Effects() {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const fillMeters = () => {
      document.querySelectorAll<HTMLElement>("#meters .fill").forEach((f) => {
        const w = Number(f.dataset.w || "0");
        f.style.transform = `scaleX(${w / 100})`;
      });
      const ring = document.querySelector<SVGCircleElement>(".g-prog");
      if (ring) {
        const C = 2 * Math.PI * 52;
        const pct = Number(ring.dataset.pct || "0");
        ring.style.strokeDashoffset = String(C * (1 - pct / 100));
      }
    };

    const countUp = (el: HTMLElement) => {
      const target = Number(el.dataset.count || "0");
      const dur = 1300;
      let start: number | null = null;
      const step = (t: number) => {
        if (start === null) start = t;
        const p = Math.min((t - start) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * e).toFixed(1);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const reveals = Array.from(document.querySelectorAll<HTMLElement>(".rv, .stagger"));

    if (reduce) {
      fillMeters();
      const c = document.querySelector<HTMLElement>("[data-count]");
      if (c) c.textContent = c.dataset.count || "";
      reveals.forEach((e) => e.classList.add("in"));
      return;
    }

    const reveal = (el: HTMLElement) => {
      if (el.classList.contains("in")) return;
      el.classList.add("in");
      if (el.querySelector("#meters")) {
        setTimeout(fillMeters, 150);
        const cc = el.querySelector<HTMLElement>("[data-count]");
        if (cc) countUp(cc);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          reveal(el);
          io.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );
    reveals.forEach((e) => io.observe(e));

    // Safety net: if the observer never fires for an above-the-fold element
    // (slow hydration, backgrounded tab, browser IO quirks), force it visible
    // rather than leaving content permanently hidden behind opacity:0.
    const fallback = window.setTimeout(() => {
      reveals.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) {
          // Skip the CSS transition here: on a throttled/backgrounded tab the
          // transition can get stuck mid-flight (currentTime frozen at 0),
          // leaving opacity permanently at 0 even after the "in" class lands.
          el.style.transition = "none";
          reveal(el);
        }
      });
    }, 1200);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
