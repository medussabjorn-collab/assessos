import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";

export const metadata: Metadata = {
  title: "Press",
  description: "Prelim news, brand assets, and media contact for press inquiries.",
};

export default function PressPage() {
  return (
    <>
      <PageHero
        crumb="Company / Press"
        title="Press & media."
        sub="News about Prelim, brand assets for coverage, and how to reach us for press inquiries."
        primary={{ label: "Media inquiries", href: "/contact" }}
        secondary={{ label: "About Prelim", href: "/about" }}
      />

      <Band>
        <SectionHead title="In the news." sub="No coverage published yet — check back soon, or reach out if you're working on a story." />
      </Band>

      <Band tint>
        <SectionHead title="Brand assets." sub="Need our logo or boilerplate for a story? Contact us and we'll send a press kit." />
      </Band>

      <CTASection title="Working on a story about Prelim?" sub="Reach out and we'll get you what you need — quickly." />
    </>
  );
}
