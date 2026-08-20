export type LegalDoc = {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: { h: string; body: string[] }[];
};

// NOTE: Template legal copy — review with counsel before launch.
const DISCLAIMER =
  "This document is a template provided for the Prelim website and should be reviewed and adapted by qualified legal counsel before publication.";

export const LEGAL: LegalDoc[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    updated: "January 2026",
    intro: "This Privacy Policy explains how Prelim collects, uses, and protects personal information across our website and assessment platform.",
    sections: [
      { h: "Information we collect", body: ["We collect information you provide directly — such as your name, work email, and company when you request a demo — and information generated when candidates complete assessments.", "We also collect standard technical data (device, browser, and usage) to operate and improve the service."] },
      { h: "How we use information", body: ["To provide and improve the assessment platform, respond to requests, and communicate about the service.", "Candidate assessment data is used to produce results for the hiring organization and is never used to train AI models."] },
      { h: "Data sharing", body: ["We share data with service providers under contract, and with the hiring organization that invited a candidate. We do not sell personal information."] },
      { h: "Your rights", body: ["Depending on your location, you may have rights to access, correct, or delete your personal information. Contact us to exercise these rights."] },
      { h: "Data retention & security", body: ["We retain data only as long as necessary and protect it with technical and organizational measures aligned with our SOC 2 Type II program.", DISCLAIMER] },
    ],
  },
  {
    slug: "terms",
    title: "Terms of Service",
    updated: "January 2026",
    intro: "These Terms govern your access to and use of the Prelim website and platform.",
    sections: [
      { h: "Use of the service", body: ["You agree to use the service in compliance with applicable law and these Terms, and not to misuse or attempt to disrupt the platform."] },
      { h: "Accounts", body: ["You are responsible for maintaining the confidentiality of your account credentials and for activity under your account."] },
      { h: "Intellectual property", body: ["The platform, content, and trademarks are owned by Prelim or its licensors. Assessment content may not be copied or redistributed without permission."] },
      { h: "Disclaimers & liability", body: ["The service is provided “as is.” To the extent permitted by law, Prelim disclaims implied warranties and limits liability as set out in your agreement.", DISCLAIMER] },
    ],
  },
  {
    slug: "dpa",
    title: "Data Processing Addendum",
    updated: "January 2026",
    intro: "This Data Processing Addendum (DPA) describes how Prelim processes personal data on behalf of customers as a processor.",
    sections: [
      { h: "Roles", body: ["The customer is the controller and Prelim is the processor of candidate personal data processed through the platform."] },
      { h: "Processing details", body: ["Prelim processes candidate data solely to provide the assessment service, on documented instructions from the customer."] },
      { h: "Sub-processors", body: ["Prelim maintains a list of sub-processors and provides notice of changes, as described in the customer agreement."] },
      { h: "Security & transfers", body: ["Prelim applies appropriate technical and organizational measures and supports lawful international transfer mechanisms.", DISCLAIMER] },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    updated: "January 2026",
    intro: "This Cookie Policy explains how the Prelim website uses cookies and similar technologies.",
    sections: [
      { h: "What cookies we use", body: ["We use essential cookies required to operate the site, and — with consent where required — analytics cookies to understand usage."] },
      { h: "Managing cookies", body: ["You can control cookies through your browser settings. Disabling essential cookies may affect site functionality."] },
      { h: "Third parties", body: ["Some analytics may be provided by third parties under contract. We do not use cookies to sell personal information.", DISCLAIMER] },
    ],
  },
];

export const legalBySlug = (slug: string) => LEGAL.find((d) => d.slug === slug);
