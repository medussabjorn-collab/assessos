"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import Popover from "@mui/material/Popover";
import { Wordmark, Sun, Moon, Sliders, Shield, Code, Users, Bars, Terminal, Sparkles } from "./icons";
import { INDUSTRIES } from "@/lib/industries";
import { APP_LOGIN_URL } from "@/lib/config";

const SIGN_IN_HREF = APP_LOGIN_URL || "/contact";

const PALETTES = [
  { id: "corporate", label: "Prelim", color: "#2E86C9" },
  { id: "cobalt", label: "Cobalt", color: "#3346E0" },
  { id: "emerald", label: "Emerald", color: "#0E9E6E" },
  { id: "copper", label: "Copper", color: "#B4530A" },
];

const SOLUTIONS = [
  { Icon: Shield, name: "Leadership Hiring", slug: "leadership-hiring" },
  { Icon: Code, name: "Technical Hiring", slug: "technical-hiring" },
  { Icon: Users, name: "Non-IT Hiring", slug: "non-it-hiring" },
];

const PLATFORM_LINKS = [
  { Icon: Bars, name: "Platform", href: "/platform" },
  { Icon: Terminal, name: "Products", href: "/products" },
  { Icon: Sparkles, name: "Product Tour", href: "/product-tour" },
];

const NAV = [
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
];

export default function Nav() {
  const [dark, setDark] = useState(false);
  const [palette, setPalette] = useState("corporate");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [appearanceAnchor, setAppearanceAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const stored = localStorage.getItem("prelim-theme");
    const sysDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setDark(stored ? stored === "dark" : !!sysDark);
    const p = localStorage.getItem("prelim-palette") || "corporate";
    setPalette(p);
    if (p !== "corporate") root.setAttribute("data-palette", p);

    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toggleTheme() {
    const next = dark ? "light" : "dark";
    setDark(!dark);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("prelim-theme", next);
  }

  function pickPalette(id: string) {
    setPalette(id);
    const root = document.documentElement;
    if (id === "corporate") root.removeAttribute("data-palette");
    else root.setAttribute("data-palette", id);
    localStorage.setItem("prelim-palette", id);
  }

  const swatches = (onClick?: () => void) => (
    <div className="swatches" role="group" aria-label="Accent color">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          className="sw"
          style={{ background: p.color }}
          aria-label={p.label}
          aria-pressed={palette === p.id}
          onClick={() => {
            pickPalette(p.id);
            onClick?.();
          }}
        />
      ))}
    </div>
  );

  const appearanceOpen = Boolean(appearanceAnchor);

  const appearancePopover = (
    <Popover
      open={appearanceOpen}
      anchorEl={appearanceAnchor}
      onClose={() => setAppearanceAnchor(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { className: "appearance-pop" } }}
    >
      <button className="ap-row" onClick={toggleTheme}>
        {dark ? <Moon /> : <Sun />} {dark ? "Dark" : "Light"} mode
      </button>
      {swatches()}
    </Popover>
  );

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      className={`nav${scrolled ? " scrolled" : ""}`}
    >
      <Toolbar className="wrap nav-in" disableGutters>
        <Link className="brand" href="/" aria-label="Prelim home">
          <Wordmark />
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <div className="nav-item has-mega">
            <Link href="/solutions" className="mega-trigger">
              Solutions
              <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </Link>
            <div className="mega">
              <div className="mega-card">
                <div className="mega-grid">
                  {SOLUTIONS.map((s) => (
                    <Link className="mega-link" href={`/solutions/${s.slug}`} key={s.slug}>
                      <s.Icon /> {s.name}
                    </Link>
                  ))}
                </div>
                <div className="mega-foot">
                  <Link href="/solutions">View all solutions &rarr;</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="nav-item has-mega">
            <Link href="/industries" className="mega-trigger">
              Industries
              <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </Link>
            <div className="mega">
              <div className="mega-card">
                <div className="mega-grid">
                  {INDUSTRIES.map((ind) => (
                    <Link className="mega-link" href={`/industries/${ind.slug}`} key={ind.slug}>
                      <ind.Icon /> {ind.name}
                    </Link>
                  ))}
                </div>
                <div className="mega-foot">
                  <Link href="/industries">View all industries &rarr;</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="nav-item has-mega">
            <Link href="/platform" className="mega-trigger">
              Platform
              <svg className="caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </Link>
            <div className="mega">
              <div className="mega-card">
                <div className="mega-grid">
                  {PLATFORM_LINKS.map((l) => (
                    <Link className="mega-link" href={l.href} key={l.href}>
                      <l.Icon /> {l.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>{n.label}</Link>
          ))}
        </nav>
        <div className="nav-right">
          <Link className="signin" href="/students">Student login</Link>
          <Link className="signin" href={SIGN_IN_HREF}>Sign in</Link>
          <IconButton
            className="icon-btn"
            onClick={(e) => setAppearanceAnchor(e.currentTarget)}
            aria-label="Appearance"
            size="small"
          >
            <Sliders />
          </IconButton>
          {appearancePopover}
          <Button className="btn btn-primary demo-btn" component={Link} href="/contact" variant="contained">
            Book a demo
          </Button>
          <IconButton
            className="icon-btn menu-btn"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            size="small"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </IconButton>
        </div>
      </Toolbar>

      <Drawer anchor="top" open={open} onClose={() => setOpen(false)} className="mobile-menu-drawer">
        <div className="mobile-menu open">
          <nav aria-label="Mobile">
            <Link href="/solutions" onClick={() => setOpen(false)}>Solutions</Link>
            <Link href="/industries" onClick={() => setOpen(false)}>Industries</Link>
            <Link href="/platform" onClick={() => setOpen(false)}>Platform</Link>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
            <Link href="/students" onClick={() => setOpen(false)}>Student login</Link>
            <Link href={SIGN_IN_HREF} onClick={() => setOpen(false)}>Sign in</Link>
          </nav>
          <div className="mm-foot">
            <IconButton
              className="icon-btn"
              onClick={(e) => setAppearanceAnchor(e.currentTarget)}
              aria-label="Appearance"
              size="small"
            >
              <Sliders />
            </IconButton>
            <Button className="btn btn-primary" component={Link} href="/contact" variant="contained" onClick={() => setOpen(false)}>
              Book a demo
            </Button>
          </div>
        </div>
      </Drawer>
    </AppBar>
  );
}
