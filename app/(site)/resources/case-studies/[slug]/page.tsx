import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { Arrow } from "@/components/icons";
import { CASE_STUDIES, caseStudyBySlug } from "@/lib/case-studies";

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const c = caseStudyBySlug(params.slug);
  if (!c) return { title: "Case Study" };
  return { title: `${c.client} Case Study`, description: c.summary };
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  const c = caseStudyBySlug(params.slug);
  if (!c) notFound();

  return (
    <>
      <PageHero
        crumb={`Resources / Case Studies / ${c.client}`}
        title={c.headline}
        sub={c.summary}
        secondary={{ label: "All case studies", href: "/resources/case-studies" }}
      />

      <Band>
        <div className="cs-meta rv">
          <span className="cs-meta-item"><span className="cs-logo">{c.logo}</span> {c.client}</span>
          <Link className="cs-meta-item cs-meta-link" href={`/industries/${c.industrySlug}`}>{c.industryName}</Link>
          <Link className="cs-meta-item cs-meta-link" href={c.trackHref}>{c.trackName}</Link>
        </div>

        <div className="cs-results rv">
          {c.results.map((r) => (
            <div className="cs-result" key={r.label}>
              <span className="cs-rv tnum">{r.value}</span>
              <span className="cs-rl">{r.label}</span>
            </div>
          ))}
        </div>
      </Band>

      <Band tint>
        <div className="legal-doc rv">
          <section>
            <h2>The challenge</h2>
            {c.challenge.map((p, i) => <p key={i}>{p}</p>)}
          </section>
          <section>
            <h2>Prelim&apos;s approach</h2>
            {c.approach.map((p, i) => <p key={i}>{p}</p>)}
          </section>
        </div>
      </Band>

      <Band>
        <figure className="quote rv" style={{ gridTemplateColumns: "1fr" }}>
          <div>
            <blockquote>&ldquo;{c.quote.text}&rdquo;</blockquote>
            <figcaption className="attr">
              <span className="attr-av">{c.logo}</span>
              <span><b>{c.quote.name}</b><span className="attr-role">{c.quote.role}</span></span>
            </figcaption>
          </div>
        </figure>
      </Band>

      <CTASection title={`See what Prelim could do for you.`} sub="Bring three real openings and we'll build the assessments live." />
    </>
  );
}
