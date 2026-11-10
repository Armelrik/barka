import { AuthShell } from "@/components/auth/auth-shell";
import { RecoveryForm } from "@/components/account/recovery-form";
import { mailReady } from "@/modules/messaging/service";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mot de passe oublié | BARKA SARL" };
export default function ForgotPage() {
  return (
    <AuthShell
      title="Mot de passe oublié"
      intro="Retrouvez votre accès grâce à l’adresse email associée à votre compte."
    >
      <RecoveryForm available={mailReady()} />
    </AuthShell>
  );
}
