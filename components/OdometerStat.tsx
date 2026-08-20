// "Live metric" treatment for real stats (Mintlify/Neon-style), deliberately
// built without any JS-driven digit animation. This session had a real,
// reproduced production bug from exactly that pattern (opacity/transition
// gated on an IntersectionObserver + JS class toggle — see commit
// b5508b6): on a throttled/backgrounded tab the animation could freeze
// permanently mid-state, leaving a wrong number visible. The correct value
// here is always a plain server-rendered text node; the "alive" feel comes
// from a pure CSS @keyframes accent-fill (animation, not transition — it
// doesn't need a JS class toggle to know its start point, and
// animation-fill-mode: both guarantees the end state holds even if a
// throttled tab pauses it mid-flight).
export function OdometerStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="as odo">
      <div className="as-v tnum">{value}</div>
      <div className="as-l">{label}</div>
    </div>
  );
}
