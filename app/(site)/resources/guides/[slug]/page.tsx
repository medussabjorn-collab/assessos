import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero, Band, CTASection } from "@/components/page";
import { GUIDES, guideBySlug } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = guideBySlug(params.slug);
  if (!g) return { title: "Guide" };
  return { title: g.title, description: g.dek };
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = guideBySlug(params.slug);
  if (!g) notFound();

  return (
    <>
      <PageHero
        crumb={`Resources / Guides / ${g.audience}`}
        title={g.title}
        sub={g.dek}
        secondary={{ label: "All guides", href: "/resources/guides" }}
      />
      <Band>
        <p className="legal-updated rv">{g.steps.length} steps · {g.readMins} min read · For {g.audience}</p>
        <ol className="guide-steps rv">
          {g.steps.map((s, i) => (
            <li key={s.title}>
              <span className="gs-num">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Band>
      {g.related && g.related.length > 0 && (
        <Band tint>
          <div className="rv">
            <h2 className="related-h">Explore Prelim</h2>
            <div className="related-links">
              {g.related.map((r) => (
                <Link key={r.href} href={r.href} className="related-link">{r.label} →</Link>
              ))}
            </div>
          </div>
        </Band>
      )}
      <CTASection />
    </>
  );
}
