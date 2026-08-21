import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection, FAQ } from "@/components/page";
import { ArrowUpRight, Check } from "@/components/icons";
import { INDUSTRIES, industryBySlug } from "@/lib/industries";
import { BreadcrumbSchema } from "@/components/JsonLd";
import { PRODUCTS } from "@/lib/products";
import TechStack from "@/components/TechStack";

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
  const showTech = ind.slug === "technology-saas";

  // Non-IT first, per request; other tracks follow in their existing order.
  const roleGroups = [
    ...ind.tracks.filter((t) => t.type === "Non-IT Hiring"),
    ...ind.tracks.filter((t) => t.type !== "Non-IT Hiring"),
  ];

  // Auto-alternating band background — avoids hand-tracked tint props as sections are added/removed.
  let bandIndex = 0;
  const nextTint = () => bandIndex++ % 2 === 1;

  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Industries", href: "/industries/" },
        { name: ind.name, href: `/industries/${params.slug}/` },
      ]} />
      <PageHero
        crumb={`Industries / ${ind.name}`}
        title={`${ind.name} hiring, measured.`}
        sub={ind.intro}
        secondary={{ label: "All industries", href: "/industries" }}
      />

      <Band tint={nextTint()}>
        <div className="ind-overview rv">
          <h2>{ind.overview.title}</h2>
          <p>{ind.overview.body}</p>
        </div>
      </Band>

      <Band tint={nextTint()}>
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

      <Band tint={nextTint()}>
        <SectionHead
          title="Roles we help you hire."
          sub={`Representative job titles Prelim assesses for ${ind.name.toLowerCase()}, grouped by track.`}
        />
        <div className="techstack rv">
          {roleGroups.map((t) => (
            <div className="ts-group" key={t.type}>
              <span className="ts-cat">{t.type}</span>
              <div className="ts-chips">
                {t.roles.map((r) => <span className="ts-chip" key={r}>{r}</span>)}
              </div>
            </div>
          ))}
        </div>
      </Band>

      {showTech && (
        <Band tint={nextTint()}>
          <SectionHead title="Supported languages & frameworks." sub="The live coding environment covers the stacks your engineers actually use." />
          <TechStack />
        </Band>
      )}

      <Band tint={nextTint()}>
        <SectionHead title={`What Prelim assesses in ${ind.name}.`} />
        <ul className="checklist focus-cols rv">
          {ind.focus.map((f) => (
            <li key={f}><Check /> {f}</li>
          ))}
        </ul>
      </Band>

      <Band tint={nextTint()}>
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
                {p.roles && p.roles.length > 0 && (
                  <div className="pr-roles">
                    {p.roles.slice(0, 3).join(" · ")}
                    {p.roles.length > 3 ? ` +${p.roles.length - 3} more` : ""}
                  </div>
                )}
              </div>
              <span className="parr">→</span>
            </Link>
          ))}
        </div>
      </Band>

      <Band tint={nextTint()}>
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

      <Band tint={nextTint()}>
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
