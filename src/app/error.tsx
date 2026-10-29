"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="contenu" className="shell empty-state">
      <h1>La page n’a pas pu être affichée.</h1>
      <p>Réessayez dans un instant.</p>
      <Button onClick={reset}>Réessayer</Button>
    </main>
  );
}
