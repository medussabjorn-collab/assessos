import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import { ProductTourViewer } from "@/components/dashboard/ProductTourViewer";

export const metadata: Metadata = {
  title: "Product Tour",
  description: "See Prelim's candidate pipeline, scorecard, and analytics views — the same screens your hiring team uses every day.",
};

export default function ProductTourPage() {
  return (
    <>
      <PageHero
        crumb="Product Tour"
        title="See Prelim, screen by screen."
        sub="Three views your hiring team lives in: the candidate pipeline, an individual scorecard, and the analytics behind every decision."
        secondary={{ label: "Book a demo", href: "/contact" }}
      />

      <Band>
        <SectionHead title="Switch views." sub="Illustrative data — your workspace shows your real requisitions and candidates." />
        <ProductTourViewer />
      </Band>

      <CTASection title="Want to see it on your own roles?" sub="Bring three real openings and we'll build the assessments live." />
    </>
  );
}
