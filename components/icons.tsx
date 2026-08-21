import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export const Arrow = (p: P) => (
  <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ArrowUpRight = (p: P) => (
  <svg {...base} {...p}><path d="M7 17L17 7M9 7h8v8" /></svg>
);
export const Sun = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="4.2" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" /></svg>
);
export const Moon = (p: P) => (
  <svg {...base} {...p}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>
);
export const Sliders = (p: P) => (
  <svg {...base} {...p}><path d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3" /><circle cx="4" cy="12" r="2" /><circle cx="12" cy="10" r="2" /><circle cx="20" cy="14" r="2" /></svg>
);
export const Code = (p: P) => (
  <svg {...base} {...p}><path d="M8 6l-5 6 5 6M16 6l5 6-5 6" /></svg>
);
export const Shield = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /></svg>
);
export const ShieldCheck = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" /><path d="M9 12l2 2 4-4" /></svg>
);
export const Users = (p: P) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0111 0M16 5.4a3.2 3.2 0 010 5.2M18.5 20a5.5 5.5 0 00-3-4.9" /></svg>
);
export const Sparkles = (p: P) => (
  <svg {...base} {...p}><rect x="5" y="5" width="14" height="14" rx="3.5" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5" /></svg>
);
export const Terminal = (p: P) => (
  <svg {...base} {...p}><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="M7 10l2.5 2.5L7 15M12.5 15H16" /></svg>
);
export const Lock = (p: P) => (
  <svg {...base} {...p}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></svg>
);
export const Bars = (p: P) => (
  <svg {...base} {...p}><path d="M4 20V11M10 20V5M16 20v-6M22 20H2" /></svg>
);
export const Plug = (p: P) => (
  <svg {...base} {...p}><rect x="2.5" y="4" width="19" height="16" rx="3" /><path d="M10 9l-3 3 3 3M14 9l3 3-3 3" /></svg>
);
export const Server = (p: P) => (
  <svg {...base} {...p}><path d="M3 7l9-4 9 4-9 4z" /><path d="M3 7v6l9 4 9-4V7" /></svg>
);
export const Clock = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Check = (p: P) => (
  <svg {...base} {...p}><path d="M20 6L9 17l-5-5" /></svg>
);
export const Target = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></svg>
);
export const Scale = (p: P) => (
  <svg {...base} {...p}><path d="M12 3v18M5 7h14M7 7l-3 6a3 3 0 006 0zM17 7l3 6a3 3 0 01-6 0z" /></svg>
);
export const Globe = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 010 18M12 3a15 15 0 000 18" /></svg>
);
export const Building = (p: P) => (
  <svg {...base} {...p}><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3" /></svg>
);
export const Heart = (p: P) => (
  <svg {...base} {...p}><path d="M12 20s-7-4.5-9.5-9A4.5 4.5 0 0112 6a4.5 4.5 0 019.5 5c-2.5 4.5-9.5 9-9.5 9z" /></svg>
);
export const Cart = (p: P) => (
  <svg {...base} {...p}><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2 3h2l2.5 12.5A2 2 0 008.5 17H18a2 2 0 002-1.6L21.5 8H6" /></svg>
);
export const Factory = (p: P) => (
  <svg {...base} {...p}><path d="M3 21V10l6 4V10l6 4V6l3 1v14z" /><path d="M3 21h18" /></svg>
);
export const Headset = (p: P) => (
  <svg {...base} {...p}><path d="M4 13v-1a8 8 0 0116 0v1" /><rect x="2.5" y="13" width="4" height="6" rx="1.5" /><rect x="17.5" y="13" width="4" height="6" rx="1.5" /><path d="M20 19a4 4 0 01-4 4h-2" /></svg>
);

export function Wordmark({ className, gid = "prelimCheck" }: { className?: string; gid?: string }) {
  return (
    <span className={className} style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
      <svg className="mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="9" y1="21" x2="26" y2="6" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#84C13D" />
            <stop offset=".4" stopColor="#4FA3DA" />
            <stop offset="1" stopColor="#2E86C9" />
          </linearGradient>
        </defs>
        {/* open ring, gap at top-right where the check exits */}
        <path d="M27.26 9.5 A13 13 0 1 1 20.87 3.95" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        {/* green→blue check swoosh */}
        <path d="M9.6 15.8 L13.8 20.5 L25.6 6" stroke={`url(#${gid})`} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="wordmark">prelim</span>
    </span>
  );
}
