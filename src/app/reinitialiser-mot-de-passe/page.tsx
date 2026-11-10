import { AuthShell } from "@/components/auth/auth-shell";
import { RecoveryForm } from "@/components/account/recovery-form";
export const metadata = {
  title: "Nouveau mot de passe | BARKA SARL",
  referrer: "no-referrer" as const,
};
export default function ResetPage() {
  return (
    <AuthShell
      title="Nouveau mot de passe"
      intro="Choisissez un mot de passe unique pour protéger votre compte."
    >
      <RecoveryForm reset />
    </AuthShell>
  );
}
