"use client";
export function PrintReport() {
  return (
    <button
      type="button"
      className="team-secondary-button report-controls"
      onClick={() => window.print()}
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
