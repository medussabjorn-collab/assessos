import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Wordmark } from "./icons";

const COLS: { h: string; links: { label: string; href: string }[] }[] = [
  {
    h: "Products",
    links: [
      { label: "Technical Assessment", href: "/products/technical-assessment" },
      { label: "Leadership Assessment", href: "/products/leadership-assessment" },
      { label: "Non-IT / Functional", href: "/products/non-it-functional" },
      { label: "AI Evaluation", href: "/products/ai-evaluation" },
      { label: "Live Coding IDE", href: "/products/live-coding-ide" },
      { label: "All products", href: "/products" },
    ],
  },
  {
    h: "Solutions",
    links: [
      { label: "Leadership Hiring", href: "/solutions/leadership-hiring" },
      { label: "Technical Hiring", href: "/solutions/technical-hiring" },
      { label: "Non-IT Hiring", href: "/solutions/non-it-hiring" },
      { label: "By industry", href: "/industries" },
      { label: "All solutions", href: "/solutions" },
    ],
  },
  {
    h: "Platform",
    links: [
      { label: "How it works", href: "/platform" },
      { label: "Product Tour", href: "/product-tour" },
      { label: "Security", href: "/security" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Partners", href: "/partners" },
      { label: "Press", href: "/press" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    h: "Resources",
    links: [
      { label: "Blog & Insights", href: "/resources/blog" },
      { label: "Guides", href: "/resources/guides" },
      { label: "Case Studies", href: "/resources/case-studies" },
      { label: "ROI Calculator", href: "/resources/roi-calculator" },
      { label: "Student login", href: "/students" },
    ],
  },
];

export default function Footer() {
  return (
    <Box component="footer" className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" href="/"><Wordmark gid="prelimCheckFoot" /></Link>
            <Typography component="p">Calibrated hiring judgment for leadership, technical, and non-IT roles.</Typography>
            <div className="foot-badges">
              <span className="fb">SOC 2 TYPE II</span>
              <span className="fb">GDPR</span>
              <span className="fb">ISO 27001</span>
            </div>
          </div>
          {COLS.map((col) => (
            <div className="foot-col" key={col.h}>
              <Typography component="h5" variant="subtitle2">{col.h}</Typography>
              {col.links.map((l) => (
                <Link href={l.href} key={l.label}>{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="foot-bot">
          <span className="mono">© {new Date().getFullYear()} Prelim, Inc.</span>
          <span className="foot-legal mono">
            <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/terms">Terms</Link> ·{" "}
            <Link href="/security">Security</Link> · <Link href="/legal/dpa">DPA</Link> ·{" "}
            <Link href="/legal/cookies">Cookies</Link>
          </span>
        </div>
      </div>
    </Box>
  );
}
