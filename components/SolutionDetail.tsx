import type { ComponentType, SVGProps } from "react";
import { PageHero, Band, SectionHead, Split, CardGrid, FAQ, CTASection } from "@/components/page";
import TechStack from "@/components/TechStack";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export type SolutionData = {
  crumb: string;
  title: string;
  sub: string;
  overview: { title: string; body: string; points: string[] };
  stat: { value: string; label: string; note: string };
  capsTitle: string;
  capsSub?: string;
  caps: { Icon: Icon; title: string; desc: string }[];
  showTechStack?: boolean; // languages/frameworks/tools the assessment supports
  roles?: string[]; // representative job titles commonly assessed with this
  faq: { q: string; a: string }[];
  cta: { title: string; sub: string };
};

export default function SolutionDetail({ data }: { data: SolutionData }) {
  // Auto-alternating band background as sections are added/removed.
  let bandIndex = 0;
  const nextTint = () => bandIndex++ % 2 === 1;

  return (
    <>
      <PageHero crumb={data.crumb} title={data.title} sub={data.sub} secondary={{ label: "See pricing", href: "/pricing" }} />

      <Band tint={nextTint()}>
        <Split
          title={data.overview.title}
          body={data.overview.body}
          points={data.overview.points}
          media={
            <div className="sd-panel">
              <span className="sd-v tnum">{data.stat.value}</span>
              <span className="sd-l">{data.stat.label}</span>
              <p className="sd-note">{data.stat.note}</p>
            </div>
          }
        />
      </Band>

      <Band tint={nextTint()}>
        <SectionHead title={data.capsTitle} sub={data.capsSub} />
        <CardGrid items={data.caps} />
      </Band>

      {data.roles && data.roles.length > 0 && (
        <Band tint={nextTint()}>
          <SectionHead title="Roles commonly assessed." sub="A sample of the job titles teams use this for." />
          <div className="ts-chips rv">
            {data.roles.map((r) => <span className="ts-chip" key={r}>{r}</span>)}
          </div>
        </Band>
      )}

      {data.showTechStack && (
        <Band tint={nextTint()}>
          <SectionHead title="Supported languages & frameworks." sub="The live coding environment covers the stacks your engineers actually use." />
          <TechStack />
        </Band>
      )}

      <Band tint={nextTint()}>
        <SectionHead title="Questions teams ask us." />
        <FAQ items={data.faq} />
      </Band>

      <CTASection title={data.cta.title} sub={data.cta.sub} />
    </>
  );
}
