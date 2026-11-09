import type { Metadata } from "next";
import localFont from "next/font/local";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import "./properties.css";
import "./immersive.css";
import "./account.css";
const inter = localFont({
  src: "../assets/fonts/InterVariable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});
export const metadata: Metadata = {
  title: "BARKA SARL | Votre prochain chapitre commence ici",
  description:
    "Découvrez BARKA SARL, votre future plateforme immobilière au Burkina Faso. Aperçu de démonstration : villas, parcelles et locations à Ouagadougou.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
