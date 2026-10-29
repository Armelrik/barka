import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
const poppins = localFont({
  src: [
    {
      path: "../assets/fonts/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/Poppins-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
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
    <html lang="fr" className={poppins.variable}>
      <body>
        <a href="#contenu" className="skip-link">
          Aller au contenu
        </a>
        {children}
      </body>
    </html>
  );
}
