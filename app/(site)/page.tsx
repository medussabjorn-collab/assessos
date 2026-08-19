import Hero from "@/components/Hero";
import { Clients, Solutions, IndustriesHome, Platform, Products, Testimonial, Integrations, Security, CTA } from "@/components/Sections";

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
