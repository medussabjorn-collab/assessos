import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog & Insights",
  description: "Ideas on structured hiring, assessment design, and what the data shows — from the Prelim team.",
};

export default function BlogIndexPage() {
  return (
    <>
      <PageHero crumb="Resources / Blog" title="Blog & Insights." sub="Ideas on structured hiring, assessment design, and what the data actually shows." secondary={{ label: "All resources", href: "/resources" }} />

      <Band>
        <SectionHead title="Latest posts." />
        <div className="post-list stagger">
          {POSTS.map((p) => (
            <Link className="post-row" href={`/resources/blog/${p.slug}`} key={p.slug}>
              <div className="post-meta">
                <span className="post-cat">{p.category}</span>
                <span className="post-date">{new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="post-read">{p.readMins} min read</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.dek}</p>
            </Link>
          ))}
        </div>
      </Band>

      <CTASection title="Want this in your inbox?" sub="Reach out and we'll add you to the list — no spam, just new posts." />
    </>
  );
}
