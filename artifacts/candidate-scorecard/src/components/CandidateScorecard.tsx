import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, ShieldCheck, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ScoreGauge } from "./ScoreGauge";
import type { Candidate } from "@/lib/candidates";
import { VERDICT_LABEL } from "@/lib/candidates";

const VERDICT_STYLE: Record<Candidate["verdict"], string> = {
  "strong-hire": "bg-accent/15 text-accent border-accent/40 dark:bg-accent/20",
  consider: "bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400",
  "no-hire": "bg-destructive/10 text-destructive border-destructive/30",
};

function Meter({ label, score, evidence, delay }: { label: string; score: number; evidence: string; delay: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 120 + delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="group">
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-foreground/90">{label}</span>
        <span className="font-mono-tab text-muted-foreground">{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1.5 hidden text-xs leading-relaxed text-muted-foreground group-hover:block">
        {evidence}
      </p>
    </div>
  );
}

export function CandidateScorecard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_4px_rgba(14,22,45,0.05),0_24px_60px_-24px_rgba(14,22,45,0.35)]">
      {/* console chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
          <span className="h-2.5 w-2.5 rounded-full bg-border" />
        </div>
        <span className="ml-1 font-mono-tab text-[11px] text-muted-foreground">
          prelim / candidates / {candidate.id} / scorecard
        </span>
      </div>

      <div className="p-6">
        {/* identity row */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-semibold text-white shadow-sm">
              {candidate.initials}
            </div>
            <div>
              <div className="font-semibold leading-tight">{candidate.name}</div>
              <div className="font-mono-tab text-[11px] uppercase tracking-wide text-muted-foreground">
                {candidate.role} · {candidate.req}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={cn("shrink-0 font-mono-tab text-[11px]", VERDICT_STYLE[candidate.verdict])}>
            {VERDICT_LABEL[candidate.verdict]}
          </Badge>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="integrity">Integrity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5">
            <div className="flex items-center gap-5 pb-5">
              <ScoreGauge value={candidate.composite} size={112} />
              <div className="flex-1 space-y-2">
                <Row k="Track" v={candidate.track} />
                <Row k="Percentile" v={candidate.percentile} />
                <Row k="Benchmark" v={candidate.benchmark} />
                <Row k="Confidence" v={candidate.confidence} />
              </div>
            </div>
            <Separator className="mb-5" />
            <div className="space-y-4">
              {candidate.competencies.map((c, i) => (
                <Meter key={c.label} label={c.label} score={c.score} evidence={c.evidence} delay={i * 60} />
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              Hover a competency for the evidence behind its score.
            </p>
          </TabsContent>

          <TabsContent value="evidence" className="mt-5 space-y-3">
            {candidate.competencies.map((c) => (
              <div key={c.label} className="rounded-lg border border-border bg-secondary/40 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{c.label}</span>
                  <span className="font-mono-tab text-xs text-muted-foreground">{c.score}/100</span>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{c.evidence}</p>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="integrity" className="mt-5 space-y-3">
            {candidate.integrity.map((sig) => (
              <div key={sig.label} className="flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                {sig.status === "clean" ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                )}
                <div>
                  <div className="text-sm font-medium">{sig.label}</div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{sig.detail}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <Separator className="my-5" />

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono-tab text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" /> {candidate.latencyMs}ms median
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> SOC 2 Type II
          </span>
          <span>Data never used to train models</span>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5 text-sm last:border-0 last:pb-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
