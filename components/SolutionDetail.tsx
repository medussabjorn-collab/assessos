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
  faq: { q: string; a: string }[];
  cta: { title: string; sub: string };
};

export default function SolutionDetail({ data }: { data: SolutionData }) {
  return (
    <>
      <PageHero crumb={data.crumb} title={data.title} sub={data.sub} secondary={{ label: "See pricing", href: "/pricing" }} />

      <Band>
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

      <Band tint>
        <SectionHead title={data.capsTitle} sub={data.capsSub} />
        <CardGrid items={data.caps} />
      </Band>

      {data.showTechStack && (
        <Band>
          <SectionHead title="Supported languages & frameworks." sub="The live coding environment covers the stacks your engineers actually use." />
          <TechStack />
        </Band>
      )}

      <Band tint={!!data.showTechStack}>
        <SectionHead title="Questions teams ask us." />
        <FAQ items={data.faq} />
      </Band>

      <CTASection title={data.cta.title} sub={data.cta.sub} />
    </>
  );
}
