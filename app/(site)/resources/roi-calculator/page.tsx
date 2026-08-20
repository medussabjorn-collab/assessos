import type { Metadata } from "next";
import { PageHero, Band, CTASection } from "@/components/page";
import ROICalculator from "@/components/ROICalculator";

export const metadata: Metadata = {
  title: "ROI Calculator",
  description: "Estimate the time and cost Prelim could save your hiring pipeline, based on your own numbers.",
};

export default function ROICalculatorPage() {
  return (
    <>
      <PageHero
        crumb="Resources / ROI Calculator"
        title="Estimate your time and cost savings."
        sub="Adjust the numbers to match your team. Everything here is your own inputs — no data leaves this page."
        secondary={{ label: "Book a demo", href: "/contact" }}
      />
      <Band>
        <ROICalculator />
      </Band>
      <CTASection title="Want the real numbers for your team?" sub="Bring your actual hiring volume and we'll build the assessment live." />
    </>
  );
}
