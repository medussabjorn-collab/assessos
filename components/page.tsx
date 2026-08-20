import type { ReactNode, ComponentType, SVGProps } from "react";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
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
        <Typography component="h1" variant="inherit">{title}</Typography>
        <Typography component="p" className="lead">{sub}</Typography>
        <div className="page-actions">
          <Button className="btn btn-primary" component={Link} href={primary.href} variant="contained">
            {primary.label} <Arrow />
          </Button>
          {secondary && (
            <Button className="btn btn-ghost" component={Link} href={secondary.href} variant="outlined">
              {secondary.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

export function Band({
  children,
  id,
  tint,
  style,
}: {
  children: ReactNode;
  id?: string;
  tint?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <section className={`blk${tint ? " band" : ""}`} id={id} style={style}>
      <div className="wrap">{children}</div>
    </section>
  );
}

export function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="sec-head rv">
      <Typography component="h2" variant="inherit">{title}</Typography>
      {sub && <Typography component="p" variant="inherit">{sub}</Typography>}
    </div>
  );
}

export function CardGrid({ items }: { items: { Icon: Icon; title: string; desc: string }[] }) {
  return (
    <div className="cardgrid stagger">
      {items.map(({ Icon, title, desc }) => (
        <Card key={title} className="card" variant="outlined">
          <CardContent>
            <div className="ci"><Icon /></div>
            <Typography component="h3" variant="inherit">{title}</Typography>
            <Typography component="p" variant="inherit">{desc}</Typography>
          </CardContent>
        </Card>
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
        <Typography component="h2" variant="inherit">{title}</Typography>
        <Typography component="p" variant="inherit">{body}</Typography>
        {points && (
          <List className="checklist" disablePadding>
            {points.map((p) => (
              <ListItem key={p} disableGutters disablePadding>
                <ListItemIcon><Check /></ListItemIcon>
                <ListItemText primary={p} />
              </ListItem>
            ))}
          </List>
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
        <Accordion key={it.q} disableGutters>
          <AccordionSummary>{it.q}</AccordionSummary>
          <AccordionDetails>{it.a}</AccordionDetails>
        </Accordion>
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
          <Typography component="h2" variant="inherit">{title}</Typography>
          <Typography component="p" variant="inherit">{sub}</Typography>
          <div className="hero-cta">
            <Button className="btn btn-primary" component={Link} href="/contact" variant="contained">
              Book a demo <Arrow />
            </Button>
            <Button className="btn btn-ghost" component={Link} href="/pricing" variant="outlined">
              See pricing
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
