import type { TourDto } from "./validation";
export const demoTour: TourDto = {
  title: "Une autre façon de visiter",
  demo: true,
  backHref: "/biens",
  floorPlanUrl: "/immersive-demo/plan.svg",
  modelUrl: "/immersive-demo/maison.glb",
  scenes: [
    {
      id: "salon",
      title: "Salon",
      image: "/immersive-demo/salon.jpg",
      initialYaw: 0,
      initialPitch: 0,
      planX: 0.27,
      planY: 0.52,
      hotspots: [
        {
          id: "cuisine",
          label: "Cuisine",
          targetSceneId: "cuisine",
          yaw: 90,
          pitch: 0,
        },
        {
          id: "info",
          label:
            "Espace de démonstration calculé : il ne représente aucun bien réel.",
          targetSceneId: null,
          yaw: 0,
          pitch: 0,
        },
      ],
    },
    {
      id: "cuisine",
      title: "Cuisine",
      image: "/immersive-demo/cuisine.jpg",
      initialYaw: 0,
      initialPitch: 0,
      planX: 0.74,
      planY: 0.52,
      hotspots: [
        {
          id: "salon",
          label: "Salon",
          targetSceneId: "salon",
          yaw: -90,
          pitch: 0,
        },
      ],
    },
  ],
};
