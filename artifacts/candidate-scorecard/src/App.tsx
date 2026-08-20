import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { PrelimLogo } from "./components/PrelimLogo";
import { CandidateScorecard } from "./components/CandidateScorecard";
import { CANDIDATES } from "./lib/candidates";
import { cn } from "./lib/utils";

function App() {
  const [dark, setDark] = useState(false);
  const [activeId, setActiveId] = useState(CANDIDATES[0].id);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const candidate = CANDIDATES.find((c) => c.id === activeId)!;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* ambient brand glow, matches prelim.io hero */}
      <div
        className="pointer-events-none absolute -right-40 -top-56 h-[640px] w-[640px] rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--primary) / 0.35), transparent 62%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--accent) / 0.28), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center px-6 py-14">
        {/* header */}
        <div className="mb-10 flex w-full max-w-xl items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <PrelimLogo className="h-7 w-7 text-foreground" />
            <span className="lowercase">prelim</span>
          </div>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>

        {/* eyebrow + title */}
        <div className="mb-8 max-w-xl text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Live scorecard preview
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Every hire, one defensible scorecard.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The same evidence-linked format across leadership, technical, and non-IT roles.
          </p>
        </div>

        {/* candidate switcher */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {CANDIDATES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                c.id === activeId
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              {c.name} · {c.track.replace(" Hiring", "")}
            </button>
          ))}
        </div>

        <CandidateScorecard candidate={candidate} />

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Illustrative candidate data for preview purposes only.
        </p>
      </div>
    </div>
  );
}

export default App;
