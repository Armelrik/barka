"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, House, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
const links = [
  { href: "/", label: "Accueil" },
  { href: "/#catalogue", label: "Nos biens" },
  { href: "/#approche", label: "Notre approche" },
  { href: "/#projet", label: "Le projet" },
];
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="site-header shell">
        <Link href="/" className="brand" aria-label="BARKA SARL, accueil">
          <House size={31} strokeWidth={1.55} />
          <span>
            BARKA<small>SARL</small>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Navigation principale">
          {links.map((link) => (
            <Link href={link.href} key={link.label}>
              {link.label}
            </Link>
          ))}
        </nav>
        <Button asChild size="sm" className="header-cta">
          <Link href="/#catalogue">
            Explorer les biens <ArrowUpRight size={15} />
          </Link>
        </Button>
        <button
          type="button"
          className="menu-toggle"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
      </header>
      {open && (
        <nav
          id="mobile-navigation"
          className="mobile-nav shell"
          aria-label="Navigation mobile"
        >
          {links.map((link) => (
            <Link
              href={link.href}
              key={link.label}
              onClick={() => setOpen(false)}
            >
              {link.label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
