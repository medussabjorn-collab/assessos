import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { OrganizationSchema, WebSiteSchema } from "@/components/JsonLd";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

const SITE = "https://prelim.io";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Prelim — Hire on evidence, not instinct",
    template: "%s · Prelim",
  },
  description:
    "Prelim is the enterprise assessment platform that measures leadership, technical, and non-IT candidates on one defensible model — and returns a ranked shortlist your team can stand behind.",
  keywords: [
    "talent assessment",
    "technical hiring",
    "leadership assessment",
    "pre-employment testing",
    "coding assessment",
    "psychometric assessment",
    "enterprise hiring platform",
  ],
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Prelim",
    title: "Prelim — Hire on evidence, not instinct",
    description:
      "One defensible scoring model across leadership, technical, and non-IT hiring. Trusted by 1,117+ enterprise teams.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Prelim — Hire on evidence, not instinct." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prelim — Hire on evidence, not instinct",
    description:
      "Enterprise assessment platform for leadership, technical, and non-IT hiring.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

// Set theme + palette before first paint to avoid a flash.
const noFlash = `(function(){try{var t=localStorage.getItem('prelim-theme');if(t)document.documentElement.setAttribute('data-theme',t);var p=localStorage.getItem('prelim-palette');if(p)document.documentElement.setAttribute('data-palette',p);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlash }} />
        <OrganizationSchema />
        <WebSiteSchema />
      </head>
      <body>{children}</body>
    </html>
  );
}
