export function PrelimLogo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="prelimCheck" x1="9" y1="21" x2="26" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#84C13D" />
          <stop offset="0.4" stopColor="#4FA3DA" />
          <stop offset="1" stopColor="#2E86C9" />
        </linearGradient>
      </defs>
      <path
        d="M27.26 9.5 A13 13 0 1 1 20.87 3.95"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M9.6 15.8 L13.8 20.5 L25.6 6"
        stroke="url(#prelimCheck)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
