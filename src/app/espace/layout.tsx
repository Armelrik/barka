import { Suspense } from "react";
import {
  WorkspaceNavigation,
  type WorkspaceNavItem,
} from "@/components/backoffice/workspace-navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import localFont from "next/font/local";
import Link from "next/link";
import {
  CalendarDays,
  House,
  LayoutDashboard,
  ArrowUpRight,
} from "lucide-react";
import { getDb } from "@/lib/server/db";
import { requirePageUser } from "@/lib/server/page-auth";
import { principalFor } from "@/lib/server/session";
import { roleLabels } from "@/modules/identity/validation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/auth/logout-button";
const sourceSans = localFont({
  src: [
    { path: "../../assets/fonts/SourceSansPro-Regular.ttf", weight: "400" },
    { path: "../../assets/fonts/SourceSansPro-SemiBold.ttf", weight: "600" },
    { path: "../../assets/fonts/SourceSansPro-Bold.ttf", weight: "700" },
  ],
  variable: "--font-source-sans",
  display: "swap",
});
export const metadata = { title: "Mon espace | BARKA SARL" };
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  const unread = await getDb().notification.count({
    where: { userId: user.id, channel: "IN_APP", readAt: null },
  });
  const notificationLabel = unread
    ? `Notifications (${unread})`
    : "Notifications";
  if (user.role.code === "CLIENT")
    return (
      <>
        <SiteHeader userName={user.firstName} />
        <div className="client-workspace">
          <div className="shell">
            <nav
              className="client-workspace-nav"
              aria-label="Navigation de mon espace"
            >
              <Link href="/espace">
                <LayoutDashboard size={18} />
                Vue d’ensemble
              </Link>
              <Link href="/biens">
                <House size={18} />
                Explorer les biens
              </Link>
              <Link href="/espace/visites">
                <CalendarDays size={18} />
                Mes visites
              </Link>
              <Link href="/espace/favoris">Mes favoris</Link>
              <Link href="/espace/recherches">Mes recherches</Link>
              <Link href="/espace/notifications">{notificationLabel}</Link>
              <Link href="/espace/compte">Mon compte et sécurité</Link>
              <LogoutButton />
            </nav>
            <main id="contenu" className="workspace-main">
              {children}
            </main>
          </div>
        </div>
        <SiteFooter />
      </>
    );
  return (
    <div className={`workspace workspace-admin ${sourceSans.variable}`}>
      <aside className="workspace-sidebar">
        <Link
          className="workspace-brand"
          href="/"
          aria-label="BARKA SARL, accueil"
        >
          <BrandLogo light />
        </Link>
        <div className="workspace-identity">
          <span className="workspace-avatar">
            {user.firstName.slice(0, 1)}
            {user.lastName.slice(0, 1)}
          </span>
          <div>
            <strong>
              {user.firstName} {user.lastName}
            </strong>
            <small>{roleLabels[user.role.code]}</small>
          </div>
        </div>
        <Suspense fallback={<nav aria-label="Navigation de mon espace" />}>
          <WorkspaceNavigation
            items={
              [
                { href: "/espace", label: "Vue d’ensemble", icon: "dashboard" },
                ...(principalFor(user).permissions.includes("users.manage")
                  ? [
                      {
                        href: "/espace/equipe",
                        label: "Mon équipe",
                        icon: "users",
                      },
                    ]
                  : []),
                ...(principalFor(user).permissions.includes("properties.manage")
                  ? [
                      {
                        href: "/espace/biens",
                        label: "Mes biens immobiliers",
                        icon: "house",
                      },
                      {
                        href: "/espace/verification",
                        label: "Vérification des profils",
                        icon: "users",
                      },
                    ]
                  : []),
                {
                  href: "/espace/visites",
                  label: "Mes visites",
                  icon: "calendar",
                },
                ...(principalFor(user).permissions.includes("properties.manage")
                  ? [
                      {
                        href: "/espace/visites?view=team",
                        label: "Demandes de visite reçues",
                        icon: "calendar",
                      },
                    ]
                  : []),
                {
                  href: "/espace/favoris",
                  label: "Mes favoris",
                  icon: "house",
                },
                {
                  href: "/espace/recherches",
                  label: "Mes recherches",
                  icon: "house",
                },
                {
                  href: "/espace/notifications",
                  label: notificationLabel,
                  icon: "activity",
                },
                ...(principalFor(user).permissions.includes("properties.manage")
                  ? [
                      {
                        href: "/espace/disponibilites",
                        label: "Agenda des disponibilités",
                        icon: "calendar",
                      },
                    ]
                  : []),
                {
                  href: "/espace/compte",
                  label: "Mon compte et sécurité",
                  icon: "account",
                },
                ...(user.role.code === "SUPER_ADMIN"
                  ? [
                      {
                        href: "/espace/publicites",
                        label: "Publicités",
                        icon: "house",
                      },
                      {
                        href: "/espace/statistiques",
                        label: "Audience et statistiques",
                        icon: "activity",
                      },
                    ]
                  : []),
                ...(principalFor(user).permissions.includes("settings.manage")
                  ? [
                      {
                        href: "/espace/activite",
                        label: "Historique d’activité",
                        icon: "activity",
                      },
                      {
                        href: "/espace/parametres",
                        label: "Paramètres",
                        icon: "settings",
                      },
                    ]
                  : []),
                { href: "/biens", label: "Explorer les biens", icon: "house" },
              ] as WorkspaceNavItem[]
            }
          />
        </Suspense>
        <div className="workspace-logout">
          <LogoutButton />
        </div>
        <span className="workspace-signature">
          L’immobilier en toute confiance.
        </span>
      </aside>
      <div className="workspace-content">
        <header className="workspace-header">
          <span>{user.company.name}</span>
          <Link href="/">
            Retour au site <ArrowUpRight size={15} />
          </Link>
        </header>
        <main id="contenu" className="workspace-main">
          {children}
        </main>
      </div>
    </div>
  );
}
