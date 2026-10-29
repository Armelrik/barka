import Link from "next/link";
export default function NotFound() {
  return (
    <main id="contenu" className="shell empty-state">
      <h1>Cette page est introuvable.</h1>
      <p>Retrouvez les exemples de biens BARKA depuis l’accueil.</p>
      <Link className="text-link" href="/">
        Revenir à l’accueil
      </Link>
    </main>
  );
}
