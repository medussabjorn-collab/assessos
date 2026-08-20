"use client";

import { useInView } from "./useInView";

export type FunnelStage = { label: string; value: number; display: string };

export function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const max = stages[0]?.value || 1;

  return (
    <div ref={ref} className="dash-funnel">
      {stages.map((s) => (
        <div className="df-row" key={s.label}>
          <span className="df-label">{s.label}</span>
          <div className="df-track">
            <div
              className="df-fill"
              style={{ width: inView ? `${(s.value / max) * 100}%` : 0 }}
            />
          </div>
          <span className="df-val">{s.display}</span>
        </div>
      ))}
    </div>
  );
}
