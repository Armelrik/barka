import Link from "next/link";
import { House, LayoutDashboard, UsersRound, ArrowUpRight } from "lucide-react";
import { requirePageUser } from "@/lib/server/page-auth";
import { principalFor } from "@/lib/server/session";
import { roleLabels } from "@/modules/identity/validation";
import { BrandLogo } from "@/components/brand-logo";
import { LogoutButton } from "@/components/auth/logout-button";
export const metadata = { title: "Mon espace | BARKA SARL" };
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePageUser();
  return (
    <div className="workspace">
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
        <nav aria-label="Navigation de mon espace">
          <Link href="/espace">
            <LayoutDashboard size={18} />
            Vue d’ensemble
          </Link>
          {principalFor(user).permissions.includes("users.manage") && (
            <Link href="/espace/equipe">
              <UsersRound size={18} />
              Mon équipe
            </Link>
          )}
          <Link href="/#catalogue">
            <House size={18} />
            Explorer les biens
            <ArrowUpRight size={14} />
          </Link>
        </nav>
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
