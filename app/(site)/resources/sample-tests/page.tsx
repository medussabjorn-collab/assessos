import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CTASection } from "@/components/page";
import SampleTests from "@/components/SampleTests";

export const metadata: Metadata = {
  title: "Sample Tests",
  description: "See example questions from Prelim's Leadership, Technical, and Non-IT assessment tracks.",
};

export default function SampleTestsPage() {
  return (
    <>
      <PageHero
        crumb="Resources / Sample Tests"
        title="See what candidates actually see."
        sub="A few real example questions from each track. Your live assessment is tailored to the specific role — these show the format and the kind of judgment each track measures."
        secondary={{ label: "Book a demo", href: "/contact" }}
      />
      <Band>
        <SectionHead title="Pick a track." />
        <SampleTests />
      </Band>
      <CTASection title="Want to see the full assessment?" sub="Bring a real role and we'll build it live." />
    </>
  );
}
