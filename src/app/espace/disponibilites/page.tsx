import { requirePageUser } from "@/lib/server/page-auth";
import { AvailabilityPanel } from "@/components/account/availability-panel";
import { availabilityWorkspace } from "@/modules/availability/service";
export const metadata = { title: "Agenda des disponibilités | BARKA SARL" };
export default async function AvailabilityPage() {
  const actor = await requirePageUser("properties.manage");
  return (
    <>
      <div className="workspace-heading">
        <h1>Agenda des disponibilités</h1>
        <p>
          Définissez les plages pendant lesquelles vos commerciaux peuvent
          recevoir des visites.
        </p>
      </div>
      <AvailabilityPanel agents={await availabilityWorkspace(actor)} />
    </>
  );
}
