import { z } from "zod";
export const uploadKind = z.enum([
  "PHOTO",
  "PANORAMA",
  "MODEL_3D",
  "FLOOR_PLAN",
  "LEGAL_DOCUMENT",
  "IDENTITY",
]);
/** GLB must be self-contained: no external fetches, SVG textures or custom required decoders. */
export function validateGlb(buffer: Buffer) {
  if (
    buffer.length < 24 ||
    buffer.length > 32 * 1024 * 1024 ||
    buffer.readUInt32LE(0) !== 0x46546c67 ||
    buffer.readUInt32LE(4) !== 2 ||
    buffer.readUInt32LE(8) !== buffer.length ||
    buffer.readUInt32LE(16) !== 0x4e4f534a
  )
    throw new Error("Fichier GLB 2.0 invalide.");
  const length = buffer.readUInt32LE(12);
  if (length > 2 * 1024 * 1024 || 20 + length > buffer.length || length % 4)
    throw new Error("Structure du modèle invalide.");
  let json;
  try {
    json = JSON.parse(buffer.subarray(20, 20 + length).toString("utf8"));
  } catch {
    throw new Error("Structure JSON du modèle invalide.");
  }
  if (
    json.asset?.version !== "2.0" ||
    !Array.isArray(json.scenes) ||
    !Array.isArray(json.nodes) ||
    json.nodes.length > 10000
  )
    throw new Error("Le modèle doit contenir une scène glTF 2.0 valide.");
  let visited = 0;
  function visit(value: unknown, depth = 0) {
    if (
      typeof value === "number" &&
      (!Number.isFinite(value) || Math.abs(value) > 1e12)
    )
      throw new Error("Valeur numérique invalide dans le modèle.");
    if (++visited > 200000 || depth > 40)
      throw new Error("Le modèle est trop complexe.");
    if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) {
        if (key === "uri")
          throw new Error(
            "Les ressources du modèle doivent être intégrées au GLB.",
          );
        visit(entry, depth + 1);
      }
    }
  }
  visit(json);
  const binaryOffset = 20 + length;
  if (
    binaryOffset + 8 > buffer.length ||
    buffer.readUInt32LE(binaryOffset + 4) !== 0x004e4942
  )
    throw new Error("Le modèle doit inclure ses données binaires.");
  const binaryLength = buffer.readUInt32LE(binaryOffset);
  if (
    binaryLength % 4 ||
    binaryOffset + 8 + binaryLength !== buffer.length ||
    !Array.isArray(json.buffers) ||
    json.buffers.length !== 1 ||
    !Number.isInteger(json.buffers[0].byteLength) ||
    json.buffers[0].byteLength <= 0 ||
    json.buffers[0].byteLength > binaryLength ||
    binaryLength - json.buffers[0].byteLength > 3
  )
    throw new Error("Les données binaires du modèle sont invalides.");
  for (const view of json.bufferViews ?? [])
    if (
      view.buffer !== 0 ||
      !Number.isInteger(view.byteLength) ||
      view.byteLength < 0 ||
      !Number.isInteger(view.byteOffset ?? 0) ||
      (view.byteOffset ?? 0) < 0 ||
      (view.byteOffset ?? 0) + view.byteLength > json.buffers[0].byteLength
    )
      throw new Error("Une géométrie référence des données absentes.");
  let instances = 0;
  for (const node of json.nodes) {
    if (node.mesh === undefined) continue;
    const mesh = json.meshes?.[node.mesh];
    if (!mesh || !Array.isArray(mesh.primitives))
      throw new Error("Maillage invalide.");
    for (const primitive of mesh.primitives) {
      const accessor = json.accessors?.[primitive.attributes?.POSITION];
      if (!accessor || accessor.type !== "VEC3")
        throw new Error("Géométrie invalide.");
      instances += accessor.count;
    }
  }
  if (instances <= 0 || instances > 3000000)
    throw new Error("Le modèle est vide ou dépasse le budget de géométrie.");
  const supported = [
    "KHR_materials_unlit",
    "KHR_texture_transform",
    "KHR_materials_clearcoat",
    "KHR_materials_transmission",
    "KHR_materials_ior",
    "KHR_materials_specular",
    "KHR_materials_emissive_strength",
  ];
  if (
    [...(json.extensionsRequired ?? []), ...(json.extensionsUsed ?? [])].some(
      (e: string) => !supported.includes(e),
    )
  )
    throw new Error(
      "Ce modèle requiert un décodeur non pris en charge. Exportez un GLB non compressé.",
    );
  for (const image of json.images ?? [])
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(image.mimeType) ||
      !Number.isInteger(image.bufferView)
    )
      throw new Error(
        "Les textures doivent être des images JPEG, PNG ou WebP intégrées.",
      );
  for (const a of json.accessors ?? [])
    if (!Number.isInteger(a.count) || a.count < 0 || a.count > 3000000)
      throw new Error("La géométrie dépasse la limite autorisée.");
  return json;
}
