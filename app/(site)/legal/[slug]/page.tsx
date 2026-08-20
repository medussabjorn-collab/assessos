import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero, Band } from "@/components/page";
import { LEGAL, legalBySlug } from "@/lib/legal";

export function generateStaticParams() {
  return LEGAL.map((d) => ({ slug: d.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const d = legalBySlug(params.slug);
  if (!d) return { title: "Legal" };
  return { title: d.title, description: d.intro };
}

export default function LegalPage({ params }: { params: { slug: string } }) {
  const d = legalBySlug(params.slug);
  if (!d) notFound();

  return (
    <>
      <PageHero crumb={`Legal / ${d.title}`} title={d.title} sub={d.intro} primary={{ label: "Contact us", href: "/contact" }} secondary={{ label: "All legal", href: "/legal" }} />
      <Band>
        <div className="legal-doc rv">
          <p className="legal-updated">Last updated: {d.updated}</p>
          {d.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.body.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          ))}
        </div>
      </Band>
    </>
  );
}
