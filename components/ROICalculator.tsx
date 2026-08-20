"use client";

import { useMemo, useState } from "react";

const fmtUSD = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtNum = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function ROICalculator() {
  const [hires, setHires] = useState(50);
  const [hoursPerHire, setHoursPerHire] = useState(12);
  const [hourlyCost, setHourlyCost] = useState(75);
  const [gainPct, setGainPct] = useState(40);

  const { hoursSaved, dollarsSaved, currentHours, currentCost } = useMemo(() => {
    const currentHours = hires * hoursPerHire;
    const currentCost = currentHours * hourlyCost;
    const hoursSaved = currentHours * (gainPct / 100);
    const dollarsSaved = hoursSaved * hourlyCost;
    return { hoursSaved, dollarsSaved, currentHours, currentCost };
  }, [hires, hoursPerHire, hourlyCost, gainPct]);

  return (
    <div className="roi">
      <div className="roi-inputs">
        <div className="roi-field">
          <div className="roi-label"><span>Hires per year</span><span className="roi-val tnum">{fmtNum(hires)}</span></div>
          <input type="range" min={5} max={500} step={5} value={hires} onChange={(e) => setHires(Number(e.target.value))} aria-label="Hires per year" />
        </div>
        <div className="roi-field">
          <div className="roi-label"><span>Screening &amp; panel hours per hire</span><span className="roi-val tnum">{fmtNum(hoursPerHire)}</span></div>
          <input type="range" min={2} max={40} step={1} value={hoursPerHire} onChange={(e) => setHoursPerHire(Number(e.target.value))} aria-label="Hours per hire" />
        </div>
        <div className="roi-field">
          <div className="roi-label"><span>Blended hourly cost of that time</span><span className="roi-val tnum">{fmtUSD(hourlyCost)}</span></div>
          <input type="range" min={25} max={250} step={5} value={hourlyCost} onChange={(e) => setHourlyCost(Number(e.target.value))} aria-label="Hourly cost" />
        </div>
        <div className="roi-field">
          <div className="roi-label"><span>Assumed efficiency gain</span><span className="roi-val tnum">{gainPct}%</span></div>
          <input type="range" min={10} max={80} step={5} value={gainPct} onChange={(e) => setGainPct(Number(e.target.value))} aria-label="Assumed efficiency gain percent" />
        </div>
      </div>

      <div className="roi-output">
        <div className="roi-out-row">
          <span>Current annual screening cost</span>
          <span className="tnum">{fmtUSD(currentCost)}</span>
        </div>
        <div className="roi-out-row roi-out-main">
          <span>Estimated hours saved / year</span>
          <span className="tnum">{fmtNum(hoursSaved)} hrs</span>
        </div>
        <div className="roi-out-row roi-out-main">
          <span>Estimated cost saved / year</span>
          <span className="tnum roi-highlight">{fmtUSD(dollarsSaved)}</span>
        </div>
      </div>

      <p className="roi-fine">
        Illustrative estimate based on the inputs above — not a guarantee. The default 40% efficiency gain is
        a conservative assumption you can adjust; actual results depend on your current process and roles.
      </p>
    </div>
  );
}
