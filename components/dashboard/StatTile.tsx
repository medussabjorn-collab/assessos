"use client";

import { useEffect, useState } from "react";
import { useInView } from "./useInView";

export function StatTile({
  label,
  value,
  suffix = "",
  delta,
  deltaDir = "up",
}: {
  label: string;
  value: number;
  suffix?: string;
  delta?: string;
  deltaDir?: "up" | "down";
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 900;
    let start: number | null = null;
    function tick(t: number) {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      setDisplay(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <div ref={ref} className="dash-tile">
      <div className="dt-label">{label}</div>
      <div className="dt-value tnum">
        {display.toFixed(value % 1 !== 0 ? 1 : 0)}
        {suffix}
      </div>
      {delta && <div className={`dt-delta ${deltaDir}`}>{deltaDir === "up" ? "↑" : "↓"} {delta}</div>}
    </div>
  );
}
