import type { Metadata } from "next";
import Hero from "@/components/Hero";
import { Clients, Solutions, IndustriesHome, Platform, Products, Testimonial, Integrations, Security, CTA } from "@/components/Sections";

export const metadata: Metadata = {
  title: "AI-Powered Talent Assessment Platform | Prelim",
  description:
    "Prelim is the AI talent assessment platform for enterprise hiring teams — technical, leadership, and non-IT assessments on one defensible scoring model. Start free.",
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
