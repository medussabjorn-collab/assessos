// Renders the final value directly rather than animating a count-up: a
// requestAnimationFrame loop only advances while the browser is actually
// painting, so a throttled/backgrounded tab can freeze it mid-count,
// permanently short of the real number. Correctness over polish.
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
  return (
    <div className="dash-tile">
      <div className="dt-label">{label}</div>
      <div className="dt-value tnum">
        {value.toFixed(value % 1 !== 0 ? 1 : 0)}
        {suffix}
      </div>
      {delta && <div className={`dt-delta ${deltaDir}`}>{deltaDir === "up" ? "↑" : "↓"} {delta}</div>}
    </div>
  );
}
