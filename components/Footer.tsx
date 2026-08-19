import Link from "next/link";
import { Wordmark } from "./icons";

const COLS: { h: string; links: { label: string; href: string }[] }[] = [
  {
    h: "Products",
    links: [
      { label: "Technical Assessment", href: "/products" },
      { label: "Leadership Assessment", href: "/products" },
      { label: "Non-IT / Functional", href: "/products" },
      { label: "AI Evaluation", href: "/products" },
      { label: "Live Coding IDE", href: "/products" },
      { label: "Analytics", href: "/products" },
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
      { label: "Security", href: "/security" },
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/platform" },
    ],
  },
  {
    h: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Student login", href: "/students" },
      { label: "Book a demo", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <Link className="brand" href="/"><Wordmark gid="prelimCheckFoot" /></Link>
            <p>Calibrated hiring judgment for leadership, technical, and non-IT roles.</p>
            <div className="foot-badges">
              <span className="fb">SOC 2 TYPE II</span>
              <span className="fb">GDPR</span>
              <span className="fb">ISO 27001</span>
            </div>
          </div>
          {COLS.map((col) => (
            <div className="foot-col" key={col.h}>
              <h5>{col.h}</h5>
              {col.links.map((l) => (
                <Link href={l.href} key={l.label}>{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="foot-bot">
          <span className="mono">© {new Date().getFullYear()} Prelim, Inc.</span>
          <span className="mono">Privacy · Terms · Security · DPA</span>
        </div>
      </div>
    </footer>
  );
}
