import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/server/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Connexion | BARKA SARL" };
export default async function LoginPage() {
  if (await currentUser()) redirect("/espace");
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
