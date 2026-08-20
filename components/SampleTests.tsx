"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";
import { SAMPLE_TRACKS } from "@/lib/sample-tests";

export default function SampleTests() {
  const [active, setActive] = useState(SAMPLE_TRACKS[0].id);
  const track = SAMPLE_TRACKS.find((t) => t.id === active) || SAMPLE_TRACKS[0];

  return (
    <div>
      <div className="sample-tabs" role="tablist" aria-label="Sample assessment track">
        {SAMPLE_TRACKS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={active === t.id ? "st-active" : ""}
            onClick={() => setActive(t.id)}
          >
            <t.Icon /> {t.name}
          </button>
        ))}
      </div>

      <p className="sample-intro">{track.intro}</p>

      <div className="sample-questions">
        {track.questions.map((q) => (
          <div className="sq-card" key={q.prompt}>
            <span className="sq-format">{q.format}</span>
            <p className="sq-prompt">{q.prompt}</p>
            <div className="sq-measures"><span>Measures:</span> {q.measures}</div>
          </div>
        ))}
      </div>

      <Link className="btn btn-ghost" href={track.href}>
        See {track.name} Hiring <ArrowUpRight />
      </Link>
    </div>
  );
}
