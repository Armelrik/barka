import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/server/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Connexion | BARKA SARL" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ passwordChanged?: string }>;
}) {
  if (await currentUser()) redirect("/espace");
  return (
    <AuthShell>
      {(await searchParams).passwordChanged === "1" && (
        <p className="team-success" role="status">
          Mot de passe modifié. Reconnectez-vous avec le nouveau mot de passe.
        </p>
      )}
      <LoginForm />
    </AuthShell>
  );
}
