import { z } from "zod";
const key = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const angle = (min: number, max: number) =>
  z.number().finite().min(min).max(max);
export const tourSchema = z
  .object({
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    title: z.string().trim().min(3).max(120),
    scenes: z
      .array(
        z
          .object({
            key,
            title: z.string().trim().min(2).max(80),
            assetId: z.string().min(1).max(80),
            initialYaw: angle(-180, 180).default(0),
            initialPitch: angle(-85, 85).default(0),
            planX: z.number().min(0).max(1).nullable().default(null),
            planY: z.number().min(0).max(1).nullable().default(null),
            hotspots: z
              .array(
                z
                  .object({
                    label: z.string().trim().min(2).max(160),
                    targetKey: key.nullable(),
                    yaw: angle(-180, 180),
                    pitch: angle(-85, 85),
                  })
                  .strict(),
              )
              .max(30)
              .default([]),
          })
          .strict(),
      )
      .max(30),
    modelAssetId: z.string().min(1).max(80).nullable().default(null),
  })
  .strict()
  .superRefine((data, ctx) => {
    const keys = new Set(data.scenes.map((s) => s.key));
    if (keys.size !== data.scenes.length)
      ctx.addIssue({
        code: "custom",
        message: "Chaque pièce doit avoir un identifiant unique.",
        path: ["scenes"],
      });
    if (
      new Set(data.scenes.map((scene) => scene.assetId)).size !==
      data.scenes.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Un panorama distinct est nécessaire pour chaque pièce.",
        path: ["scenes"],
      });
    for (const [i, scene] of data.scenes.entries()) {
      if ((scene.planX === null) !== (scene.planY === null))
        ctx.addIssue({
          code: "custom",
          message: "Renseignez les deux coordonnées du plan.",
          path: ["scenes", i],
        });
      for (const h of scene.hotspots)
        if (
          h.targetKey &&
          (!keys.has(h.targetKey) || h.targetKey === scene.key)
        )
          ctx.addIssue({
            code: "custom",
            message:
              "La destination doit être une autre pièce de cette visite.",
            path: ["scenes", i, "hotspots"],
          });
    }
  });
export type TourSceneDto = {
  id: string;
  title: string;
  image: string;
  initialYaw: number;
  initialPitch: number;
  planX: number | null;
  planY: number | null;
  hotspots: {
    id: string;
    label: string;
    targetSceneId: string | null;
    yaw: number;
    pitch: number;
  }[];
};
export type TourDto = {
  title: string;
  scenes: TourSceneDto[];
  modelUrl: string | null;
  floorPlanUrl: string | null;
  backHref: string;
  demo?: boolean;
};
