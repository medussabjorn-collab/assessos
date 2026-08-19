import type { ReactNode, ComponentType, SVGProps } from "react";
import Link from "next/link";
import { Arrow, Check } from "./icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

export function PageHero({
  crumb,
  title,
  sub,
  primary = { label: "Book a demo", href: "/contact" },
  secondary,
}: {
  crumb?: string;
  title: ReactNode;
  sub: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="page-hero">
      <div className="aura" />
      <div className="wrap rv">
        {crumb && (
          <div className="crumb">
            <Link href="/">Prelim</Link> / {crumb}
          </div>
        )}
        <h1>{title}</h1>
        <p className="lead">{sub}</p>
        <div className="page-actions">
          <Link className="btn btn-primary" href={primary.href}>
            {primary.label} <Arrow />
          </Link>
          {secondary && (
            <Link className="btn btn-ghost" href={secondary.href}>{secondary.label}</Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function Band({ children, id, tint }: { children: ReactNode; id?: string; tint?: boolean }) {
  return (
    <section className={`blk${tint ? " band" : ""}`} id={id}>
      <div className="wrap">{children}</div>
    </section>
  );
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="sec-head rv">
      <h2>{title}</h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

export function CardGrid({ items }: { items: { Icon: Icon; title: string; desc: string }[] }) {
  return (
    <div className="cardgrid stagger">
      {items.map(({ Icon, title, desc }) => (
        <div className="card" key={title}>
          <div className="ci"><Icon /></div>
          <h3>{title}</h3>
          <p>{desc}</p>
        </div>
      ))}
    </div>
  );
}

export function Split({
  title,
  body,
  points,
  media,
  reverse,
}: {
  title: string;
  body: string;
  points?: string[];
  media?: ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`split rv${reverse ? " reverse" : ""}`}>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
        {points && (
          <ul className="checklist">
            {points.map((p) => (
              <li key={p}><Check /> {p}</li>
            ))}
          </ul>
        )}
      </div>
      {media && <div className="split-media">{media}</div>}
    </div>
  );
}

export function FAQ({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="faq rv">
      {items.map((it) => (
        <details key={it.q}>
          <summary>{it.q}</summary>
          <p>{it.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CTASection({
  title = "See Prelim on your roles.",
  sub = "Bring three real openings. We'll build the assessments live and show you the scorecards in 30 minutes.",
}: {
  title?: string;
  sub?: string;
}) {
  return (
    <section className="blk" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta rv">
          <h2>{title}</h2>
          <p>{sub}</p>
          <div className="hero-cta">
            <Link className="btn btn-primary" href="/contact">Book a demo <Arrow /></Link>
            <Link className="btn btn-ghost" href="/pricing">See pricing</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
