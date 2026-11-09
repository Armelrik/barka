"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm, RegistrationForm } from "@/components/auth/auth-form";
export function SiteHeaderClient({ userName }: { userName?: string }) {
  const [open, setOpen] = useState(false);
  const [registration, setRegistration] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  function showAuth(register: boolean) {
    setRegistration(register);
    setOpen(false);
    dialog.current?.showModal();
  }
  const links = [
    { href: "/", label: "Accueil" },
    { href: "/biens", label: "Propriétés" },
    { href: "/contact", label: "Contact" },
    { href: "/carte", label: "Carte" },
    { href: "/visites/demo", label: "Visite 3D" },
  ];
  return (
    <>
      <header className="site-header">
        <div className="container mx-auto px-4 py-4">
          <div className="header-row">
            <Link href="/" aria-label="BARKA SARL, accueil">
              <BrandLogo />
            </Link>
            <nav className="desktop-nav" aria-label="Navigation principale">
              {links.map((l) => (
                <Link
                  key={l.href}
                  className={
                    pathname === l.href ||
                    (l.href === "/biens" && pathname.startsWith("/biens/"))
                      ? "active"
                      : ""
                  }
                  aria-current={
                    pathname === l.href ||
                    (l.href === "/biens" && pathname.startsWith("/biens/"))
                      ? "page"
                      : undefined
                  }
                  href={l.href}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="header-actions">
              {userName ? (
                <Link className="legacy-button" href="/espace">
                  {userName} · Mon Compte
                </Link>
              ) : (
                <>
                  <button onClick={() => showAuth(false)}>Connexion</button>
                  <button
                    className="legacy-button"
                    onClick={() => showAuth(true)}
                  >
                    Inscription
                  </button>
                  <Link
                    className="legacy-button gradient"
                    href="/contact#professionnels"
                  >
                    Espace professionnel
                  </Link>
                </>
              )}
            </div>
            <button
              className="menu-toggle"
              aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
          {open && (
            <nav
              id="mobile-navigation"
              className="mobile-nav"
              aria-label="Navigation mobile"
            >
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              {userName ? (
                <Link className="legacy-button" href="/espace">
                  {userName} · Mon Compte
                </Link>
              ) : (
                <>
                  <button onClick={() => showAuth(false)}>Connexion</button>
                  <button
                    className="legacy-button"
                    onClick={() => showAuth(true)}
                  >
                    Inscription
                  </button>
                  <Link
                    className="legacy-button gradient"
                    href="/contact#professionnels"
                  >
                    Espace professionnel
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>
      <dialog
        aria-labelledby="auth-dialog-title"
        ref={dialog}
        className="auth-dialog"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        <button
          className="dialog-close"
          aria-label="Fermer"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <h2 id="auth-dialog-title">
          {registration ? "Inscription" : "Connexion"}
        </h2>
        <p className="auth-intro">
          {registration
            ? "Créez votre compte client pour suivre vos demandes de visite."
            : "Retrouvez votre espace personnel ou professionnel."}
        </p>
        {registration ? <RegistrationForm /> : <LoginForm />}
      </dialog>
    </>
  );
}
