import { requirePageUser } from "@/lib/server/page-auth";
import { managementCompanies } from "@/modules/identity/management";
import { MemberForm } from "@/components/team/member-form";
export const metadata = { title: "Créer un compte d’équipe | BARKA SARL" };
export default async function NewMemberPage() {
  const actor = await requirePageUser("users.manage");
  const companies = await managementCompanies(actor);
  return (
    <>
      <div className="workspace-heading">
        <h1>Créer un compte.</h1>
        <p>
          Le rôle doit être inférieur au vôtre. Le rattachement sera contrôlé au
          moment de l’enregistrement.
        </p>
      </div>
      <section className="team-panel">
        <MemberForm
          actorRole={actor.role.code}
          companyId={actor.companyId}
          companies={companies}
        />
      </section>
    </>
  );
}
