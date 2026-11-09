import { requirePageUser } from "@/lib/server/page-auth";
import { principalFor } from "@/lib/server/session";
import { getDb } from "@/lib/server/db";
import { identityQueue } from "@/modules/media/service";
import { IdentityPanel } from "@/components/properties/identity-panel";
export const metadata = { title: "Vérification des profils | BARKA SARL" };
export default async function VerificationPage() {
  const actor = await requirePageUser();
  const [own, queue] = await Promise.all([
    getDb().agentProfile.findUnique({
      where: { userId: actor.id },
      select: { identifier: true, verification: true, identityAssetId: true },
    }),
    principalFor(actor).permissions.includes("identity.review")
      ? identityQueue(actor)
      : Promise.resolve([]),
  ]);
  return (
    <>
      <div className="workspace-heading">
        <h1>Vérification des profils.</h1>
        <p>
          Les pièces d’identité sont privées et ne sont jamais affichées dans le
          catalogue.
        </p>
      </div>
      <IdentityPanel
        own={own}
        queue={queue.map((row) => ({
          ...row,
          updatedAt: row.updatedAt.toISOString(),
        }))}
      />
    </>
  );
}
