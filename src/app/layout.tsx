import { SiteAnalytics } from "@/components/audience/site-analytics";
import type { Metadata } from "next";
import { NavigationScrollReset } from "@/components/navigation-scroll-reset";
import { ScrollToTop } from "@/components/scroll-to-top";
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
    "Explorez les biens à vendre et à louer au Burkina Faso avec BARKA SARL : photos, carte, visites immersives et suivi de votre projet immobilier.",
  robots: { index: false, follow: false },
  referrer: "origin",
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
        <ScrollToTop />
        <NavigationScrollReset />
        <SiteAnalytics />
      </body>
    </html>
  );
}
