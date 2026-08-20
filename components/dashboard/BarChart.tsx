"use client";

import { useInView } from "./useInView";

export type BarDatum = { label: string; value: number };

export function BarChart({ data, unit = "" }: { data: BarDatum[]; unit?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div ref={ref} className={`dash-bars${inView ? " in" : ""}`}>
      {data.map((d, i) => (
        <div className="db-col" key={d.label}>
          <span className="mono" style={{ fontSize: ".7rem", color: "var(--ink-2)" }}>
            {d.value.toLocaleString()}
            {unit}
          </span>
          <div
            className="db-bar"
            style={{
              height: `${Math.max((d.value / max) * 100, 6)}%`,
              transitionDelay: `${i * 60}ms`,
            }}
          />
          <span className="db-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
