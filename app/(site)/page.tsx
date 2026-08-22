import type { Metadata } from "next";
import Hero from "@/components/Hero";
import { Clients, Solutions, IndustriesHome, Platform, Products, Testimonial, Integrations, Security, CTA } from "@/components/Sections";

export const metadata: Metadata = {
  title: "One Assessment Platform for Every Hire | Prelim",
  description:
    "Prelim unifies technical, leadership, and non-IT hiring on one scoring model. Stop running three different hiring processes. One platform, comparable verdicts, every job family.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Clients />
      <Solutions />
      <IndustriesHome />
      <Platform />
      <Products />
      <Testimonial />
      <Integrations />
      <Security />
      <CTA />
    </>
  );
}
