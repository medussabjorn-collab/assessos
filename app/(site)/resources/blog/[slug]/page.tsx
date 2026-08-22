import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHero, Band, CTASection } from "@/components/page";
import { POSTS, postBySlug } from "@/lib/blog";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = postBySlug(params.slug);
  if (!p) return { title: "Post" };
  return { title: p.title, description: p.dek };
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const p = postBySlug(params.slug);
  if (!p) notFound();

  return (
    <>
      <PageHero
        crumb={`Resources / Blog / ${p.category}`}
        title={p.title}
        sub={p.dek}
        secondary={{ label: "All posts", href: "/resources/blog" }}
      />
      <Band>
        <div className="legal-doc rv">
          <p className="legal-updated">
            {new Date(p.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {p.readMins} min read
          </p>
          {p.body.map((b, i) => (
            <section key={i}>
              {b.h && <h2>{b.h}</h2>}
              <p>{b.p}</p>
            </section>
          ))}
        </div>
      </Band>
      {p.related && p.related.length > 0 && (
        <Band tint>
          <div className="rv">
            <h2 className="related-h">Explore Prelim</h2>
            <div className="related-links">
              {p.related.map((r) => (
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
