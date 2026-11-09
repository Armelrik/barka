import { notFound } from "next/navigation";
import { z } from "zod";
import { requirePageUser } from "@/lib/server/page-auth";
import { AppError } from "@/lib/server/errors";
import {
  managedUserDetail,
  managementCompanies,
  managedUserHistory,
} from "@/modules/identity/management";
import { MemberPasswordReset } from "@/components/backoffice/password-form";
import { MemberForm } from "@/components/team/member-form";
import { MemberHistory } from "@/components/team/member-history";
export const metadata = { title: "Gérer un compte d’équipe | BARKA SARL" };
export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ historyPage?: string; saved?: string }>;
}) {
  const actor = await requirePageUser("users.manage"),
    { id } = await params,
    query = await searchParams;
  const parsed = z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .safeParse(query.historyPage ?? 1);
  const fail = (error: unknown): never => {
    if (
      error instanceof AppError &&
      (error.status === 404 || error.status === 403)
    )
      notFound();
    throw error;
  };
  const member = await managedUserDetail(actor, id).catch(fail);
  const [companies, history] = await Promise.all([
    managementCompanies(actor),
    managedUserHistory(actor, id, parsed.success ? parsed.data : 1),
  ]).catch(fail);
  return (
    <>
      <div className="workspace-heading">
        <h1>
          {member.firstName} {member.lastName}
        </h1>
        <p>Modifiez le compte et consultez les changements enregistrés.</p>
      </div>
      {query.saved === "1" && (
        <p role="status" className="team-success">
          Les informations ont été enregistrées.
        </p>
      )}
      {member.agentIdentifier && (
        <p className="team-identifier">
          Identifiant démarcheur : <strong>{member.agentIdentifier}</strong>
        </p>
      )}
      <section className="team-panel">
        <MemberForm
          key={member.updatedAt}
          member={member}
          actorRole={actor.role.code}
          companyId={actor.companyId}
          companies={companies}
        />
      </section>
      <section className="property-panel">
        <h2>Sécurité du compte</h2>
        <MemberPasswordReset id={id} updatedAt={member.updatedAt} />
      </section>
      <MemberHistory userId={id} history={history} />
    </>
  );
}
