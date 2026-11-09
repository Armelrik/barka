import { ImmersiveViewer } from "@/components/tours/immersive-viewer";
import { demoTour } from "@/modules/tours/demo";
export const metadata = { title: "Démonstration 360° et 3D | BARKA SARL" };
export default function DemoTourPage() {
  return (
    <main id="contenu">
      <ImmersiveViewer tour={demoTour} />
    </main>
  );
}
