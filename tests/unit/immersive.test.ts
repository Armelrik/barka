import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { tourSchema } from "../../src/modules/tours/validation";
import { validateGlb } from "../../src/modules/media/validation";
import {
  propertySchema,
  propertyUpdateSchema,
} from "../../src/modules/listings/validation";
import { transitions, nextStatus } from "../../src/modules/listings/policy";
const scene = {
  key: "salon",
  title: "Salon",
  assetId: "panorama-id",
  hotspots: [],
};
describe("Visites et validation des médias", () => {
  it("refuse les destinations étrangères et les identifiants de pièce dupliqués", () => {
    for (const scenes of [
      [
        {
          ...scene,
          hotspots: [
            { label: "Cuisine", targetKey: "foreign", yaw: 0, pitch: 0 },
          ],
        },
      ],
      [scene, scene],
    ])
      expect(
        tourSchema.safeParse({
          title: "Visite",
          expectedUpdatedAt: new Date().toISOString(),
          scenes,
        }).success,
      ).toBe(false);
  });
  it("refuse un pointage vers soi-même et des angles invalides", () => {
    expect(
      tourSchema.safeParse({
        title: "Visite",
        expectedUpdatedAt: new Date().toISOString(),
        scenes: [
          {
            ...scene,
            hotspots: [
              { label: "Salon", targetKey: "salon", yaw: 0, pitch: 0 },
            ],
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      tourSchema.safeParse({
        title: "Visite",
        expectedUpdatedAt: new Date().toISOString(),
        scenes: [{ ...scene, initialYaw: 181 }],
      }).success,
    ).toBe(false);
  });
  it("exige les deux positions du mini-plan", () =>
    expect(
      tourSchema.safeParse({
        title: "Visite",
        expectedUpdatedAt: new Date().toISOString(),
        scenes: [{ ...scene, planX: 0.5 }],
      }).success,
    ).toBe(false));
  it("accepte un modèle autonome et des pièces sans mini-plan", () => {
    expect(
      tourSchema.parse({
        title: "Visite",
        expectedUpdatedAt: new Date().toISOString(),
        scenes: [scene],
        modelAssetId: "model",
      }).scenes[0].planX,
    ).toBeNull();
  });
  it("valide le véritable modèle GLB de démonstration", () => {
    const bytes = readFileSync(
      new URL("../../public/immersive-demo/maison.glb", import.meta.url),
    );
    expect(validateGlb(bytes).asset.version).toBe("2.0");
  });
  it("refuse les fausses signatures et les fichiers GLB tronqués", () => {
    expect(() => validateGlb(Buffer.from("fake.glb"))).toThrow();
    const b = readFileSync(
      new URL("../../public/immersive-demo/maison.glb", import.meta.url),
    );
    expect(() => validateGlb(b.subarray(0, b.length - 1))).toThrow();
  });
  it("refuse les modèles qui déclencheraient des requêtes vers des ressources externes", () => {
    const json = Buffer.from(
      JSON.stringify({
        asset: { version: "2.0" },
        scenes: [],
        nodes: [],
        buffers: [{ uri: "https://private.example/secret" }],
      }),
    );
    const padded = Buffer.concat([
        json,
        Buffer.alloc((4 - (json.length % 4)) % 4, 32),
      ]),
      head = Buffer.alloc(20);
    head.writeUInt32LE(0x46546c67, 0);
    head.writeUInt32LE(2, 4);
    head.writeUInt32LE(20 + padded.length, 8);
    head.writeUInt32LE(padded.length, 12);
    head.writeUInt32LE(0x4e4f534a, 16);
    expect(() => validateGlb(Buffer.concat([head, padded]))).toThrow(
      /intégrées/,
    );
  });
  it("ne permet pas de sauter directement du brouillon à la publication", () => {
    expect(transitions.PUBLISH).toEqual(["APPROVED"]);
    expect(transitions.APPROVE).toEqual(["VERIFYING"]);
    expect(nextStatus.REJECT).toBe("DRAFT");
  });
  it("borne les montants, les surfaces et les coordonnées et interdit les champs d'autorisation injectés", () => {
    const p = {
      title: "Maison test",
      description: "Description de démonstration uniquement.",
      type: "VILLA",
      offer: "SALE",
      priceXof: 100000,
      surfaceM2: 120,
      locationId: "location",
      agentId: "agent",
    };
    expect(propertySchema.safeParse(p).success).toBe(true);
    for (const extra of [
      { priceXof: 2147483648 },
      { surfaceM2: -1 },
      { latitude: 100 },
      { status: "PUBLISHED" },
    ])
      expect(propertySchema.safeParse({ ...p, ...extra }).success).toBe(false);
    expect(
      propertyUpdateSchema.safeParse({
        ...p,
        companyId: "foreign",
        expectedUpdatedAt: new Date().toISOString(),
      }).success,
    ).toBe(false);
  });
});
