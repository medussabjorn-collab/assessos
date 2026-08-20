import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection, FAQ } from "@/components/page";
import { ArrowUpRight, Check } from "@/components/icons";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import { PRODUCTS } from "@/lib/products";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const ind = industryBySlug(params.slug);
  if (!ind) return { title: "Industry" };
  return {
    title: `${ind.name} Hiring`,
    description: `${ind.name} hiring, measured: leadership, technical, and non-IT tracks on one defensible model. ${ind.blurb}`,
  };
}

export default function IndustryPage({ params }: { params: { slug: string } }) {
  const ind = industryBySlug(params.slug);
  if (!ind) notFound();

  return (
    <>
      <PageHero
        crumb={`Industries / ${ind.name}`}
        title={`${ind.name} hiring, measured.`}
        sub={ind.intro}
        secondary={{ label: "All industries", href: "/industries" }}
      />

      <Band>
        <div className="ind-overview rv">
          <h2>{ind.overview.title}</h2>
          <p>{ind.overview.body}</p>
        </div>
      </Band>

      <Band tint>
        <SectionHead
          title="Choose your hiring track."
          sub={`The hiring problems that matter in ${ind.name.toLowerCase()} — one platform, one scoring model.`}
        />
        <div className={`cardgrid stagger${ind.tracks.length === 4 ? " cardgrid-4" : ""}`}>
          {ind.tracks.map((t) => (
            <Link className="card card-link" href={t.href} key={t.type}>
              <div className="ci"><t.Icon /></div>
              <h3>{t.type}</h3>
              <p>{t.tagline}</p>
              <span className="card-go">Explore <ArrowUpRight /></span>
            </Link>
          ))}
        </div>
      </Band>

      <Band>
        <SectionHead title={`What Prelim assesses in ${ind.name}.`} />
        <ul className="checklist focus-cols rv">
          {ind.focus.map((f) => (
            <li key={f}><Check /> {f}</li>
          ))}
        </ul>
      </Band>

      <Band tint>
        <SectionHead
          title="The full product catalog."
          sub={`Every module below is available for ${ind.name.toLowerCase()} hiring, feeding the same scoring model as your chosen track.`}
        />
        <div className="prodlist stagger" style={{ borderTop: "none" }}>
          {PRODUCTS.map((p) => (
            <Link className="prow" href={`/products/${p.slug}`} key={p.slug}>
              <span className="pic"><p.Icon /></span>
              <div>
                <div className="pt">{p.name}</div>
                <div className="pd">{p.blurb}</div>
              </div>
              <span className="parr">→</span>
            </Link>
          ))}
        </div>
      </Band>

      <Band>
        <div className="scenario rv">
          <div className="scenario-body">
            <span className="scenario-role">{ind.scenario.role}</span>
            <h2>A real hiring scenario.</h2>
            <div className="scenario-block">
              <span className="sb-k">The challenge</span>
              <p>{ind.scenario.challenge}</p>
            </div>
            <div className="scenario-block">
              <span className="sb-k">Prelim's approach</span>
              <p>{ind.scenario.approach}</p>
            </div>
          </div>
          <div className="scenario-metric">
            <span className="sm-v tnum">{ind.scenario.metric.value}</span>
            <span className="sm-l">{ind.scenario.metric.label}</span>
          </div>
        </div>
      </Band>

      <Band tint>
        <SectionHead title={`Questions ${ind.name.toLowerCase()} teams ask us.`} />
        <FAQ items={ind.faq} />
      </Band>

      <CTASection
        title={`Hiring in ${ind.name}?`}
        sub="Bring three real openings and we'll build the assessments live — tailored to your industry."
      />
    </>
  );
}
