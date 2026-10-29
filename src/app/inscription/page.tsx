import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/server/session";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegistrationForm } from "@/components/auth/auth-form";
export const metadata: Metadata = { title: "Créer un compte | BARKA SARL" };
export default async function RegistrationPage() {
  if (await currentUser()) redirect("/espace");
  return (
    <AuthShell registration>
      <RegistrationForm />
    </AuthShell>
  );
}
