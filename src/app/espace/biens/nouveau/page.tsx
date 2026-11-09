import { requirePageUser } from "@/lib/server/page-auth";
import { propertyOptions } from "@/modules/listings/service";
import { PropertyForm } from "@/components/properties/property-form";
export const metadata = { title: "Ajouter un bien | BARKA SARL" };
export default async function NewPropertyPage() {
  const actor = await requirePageUser("properties.manage"),
    options = await propertyOptions(actor);
  return (
    <>
      <div className="workspace-heading">
        <h1>Ajouter un bien.</h1>
        <p>
          Le dossier sera enregistré en brouillon. Ajoutez ensuite ses
          photographies, documents, panoramas et modèle 3D.
        </p>
      </div>
      <section className="property-panel">
        <PropertyForm
          options={options}
          companyId={actor.companyId}
          global={actor.role.code === "SUPER_ADMIN"}
        />
      </section>
    </>
  );
}
