"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import { Wordmark, Sun, Moon } from "./icons";
import { INDUSTRIES } from "@/lib/industries";
import { APP_LOGIN_URL } from "@/lib/config";

const SIGN_IN_HREF = APP_LOGIN_URL || "/contact";

const PALETTES = [
  { id: "corporate", label: "Prelim", color: "#2E86C9" },
  { id: "cobalt", label: "Cobalt", color: "#3346E0" },
  { id: "emerald", label: "Emerald", color: "#0E9E6E" },
  { id: "copper", label: "Copper", color: "#B4530A" },
];

const NAV = [
  { href: "/solutions", label: "Solutions" },
  { href: "/industries", label: "Industries" },
  { href: "/platform", label: "Platform" },
  { href: "/products", label: "Products" },
  { href: "/product-tour", label: "Tour" },
  { href: "/security", label: "Security" },
  { href: "/pricing", label: "Pricing" },
];

export default function Nav() {
  const [dark, setDark] = useState(false);
  const [palette, setPalette] = useState("corporate");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
          {NAV.map((n) =>
            n.href === "/industries" ? (
              <div className="nav-item has-mega" key={n.href}>
                <Link href={n.href} className="mega-trigger">
                  {n.label}
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
            ) : (
              <Link key={n.href} href={n.href}>{n.label}</Link>
            )
          )}
        </nav>
        <div className="nav-right">
          {swatches()}
          <Link className="signin" href="/students">Student login</Link>
          <Link className="signin" href={SIGN_IN_HREF}>Sign in</Link>
          <IconButton className="icon-btn" onClick={toggleTheme} aria-label="Toggle light or dark theme" size="small">
            {dark ? <Moon /> : <Sun />}
          </IconButton>
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
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
            <Link href="/students" onClick={() => setOpen(false)}>Student login</Link>
            <Link href={SIGN_IN_HREF} onClick={() => setOpen(false)}>Sign in</Link>
          </nav>
          <div className="mm-foot">
            {swatches()}
            <Button className="btn btn-primary" component={Link} href="/contact" variant="contained" onClick={() => setOpen(false)}>
              Book a demo
            </Button>
          </div>
        </div>
      </Drawer>
    </AppBar>
  );
}
