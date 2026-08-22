import type { Metadata } from "next";
import { PageHero, Band, SectionHead, CardGrid, FAQ, CTASection } from "@/components/page";
import { PhotoBand } from "@/components/Photo";
import { ShieldCheck, Lock, Server, Clock, Globe, Scale } from "@/components/icons";
import { BreadcrumbSchema } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Security & Trust",
  description:
    "SOC 2 Type II, GDPR, flexible cloud / VPC / on-prem deployment, and candidate data that never trains models. Built for regulated enterprises.",
  alternates: { canonical: "/security/" },
};

const CONTROLS = [
  { Icon: ShieldCheck, title: "SOC 2 Type II", desc: "Independently audited every year against security, availability, and confidentiality." },
  { Icon: Lock, title: "GDPR + DPA", desc: "Data-processing agreements and candidate data that never trains models." },
  { Icon: Server, title: "Cloud · VPC · On-prem", desc: "Deploy inside your own perimeter, wherever your security team requires." },
  { Icon: Globe, title: "Data residency", desc: "Keep candidate data in the region your compliance obligations demand." },
  { Icon: Scale, title: "Access controls", desc: "SSO, SCIM, role-based access, and full audit logging out of the box." },
  { Icon: Clock, title: "Reliability", desc: "207ms median latency and high-availability infrastructure for volume pipelines." },
];

export default function SecurityPage() {
  return (
    <>
      <BreadcrumbSchema items={[
        { name: "Home", href: "/" },
        { name: "Security", href: "/security/" },
      ]} />
      <PageHero
        crumb="Security"
        title="Built for the enterprise security floor."
        sub="Regulated-industry deployments, candidate privacy by default, and the flexibility to run wherever your security and compliance teams require."
        primary={{ label: "Request the security package", href: "/contact" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />

      <Band>
        <SectionHead title="Controls that pass procurement." />
        <CardGrid items={CONTROLS} />
      </Band>

      <Band style={{ paddingTop: 0 }}>
        <PhotoBand src="/images/enterprise-meeting.jpg" alt="Enterprise team reviewing reports in a boardroom" ratio="wide" />
      </Band>

      <Band tint>
        <SectionHead title="Security questions." />
        <FAQ items={[
          { q: "Is candidate data used to train AI models?", a: "No. Candidate responses are never used to train Prelim's models. Your data stays yours, and deployment options let you keep it inside your own environment." },
          { q: "Can we get your SOC 2 report and DPA?", a: "Yes. Reach out and we'll share the current SOC 2 Type II report, DPA, and a full security questionnaire under NDA." },
          { q: "Do you support SSO and provisioning?", a: "Prelim supports SAML/OIDC SSO and SCIM provisioning, with role-based access control and audit logging for every action." },
          { q: "Where is data stored?", a: "In the region you choose. For strict requirements, Prelim runs in a dedicated VPC or fully on-prem so data never leaves your perimeter." },
        ]} />
      </Band>

      <CTASection title="Bring your security team to the demo." sub="We'll walk through architecture, controls, and deployment options alongside the product." />
    </>
  );
}
