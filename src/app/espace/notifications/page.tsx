import { requirePageUser } from "@/lib/server/page-auth";
import { getDb } from "@/lib/server/db";
import { NotificationCenter } from "@/components/account/notification-center";
import { mailReady } from "@/modules/messaging/service";
export const metadata = { title: "Mes notifications | BARKA SARL" };
export default async function NotificationsPage() {
  const actor = await requirePageUser();
  const prefs = await getDb().user.findUniqueOrThrow({
    where: { id: actor.id },
    select: { emailNotifications: true },
  });
  return (
    <>
      <div className="workspace-heading">
        <h1>Mes notifications</h1>
        <p>
          Retrouvez les nouvelles demandes et les réponses concernant vos
          visites.
        </p>
      </div>
      <NotificationCenter
        initialEmail={prefs.emailNotifications}
        configured={mailReady()}
      />
    </>
  );
}
