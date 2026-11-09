// Original procedural demonstration, not a survey or reconstruction of a real property.
import { mkdir, writeFile } from "node:fs/promises";
import { BoxGeometry } from "three";
import sharp from "sharp";
const root = new URL("../public/immersive-demo/", import.meta.url);
await mkdir(root, { recursive: true });
const colors = [
  [0.91, 0.87, 0.78, 1],
  [0.1, 0.24, 0.33, 1],
  [0.64, 0.39, 0.19, 1],
  [0.88, 0.57, 0.22, 1],
  [0.15, 0.52, 0.49, 1],
  [0.95, 0.94, 0.91, 1],
];
const geometry = new BoxGeometry(1, 1, 1),
  position = Buffer.from(geometry.attributes.position.array.buffer),
  normal = Buffer.from(geometry.attributes.normal.array.buffer),
  indices = Buffer.from(geometry.index.array.buffer),
  binary = Buffer.concat([position, normal, indices]);
const boxes = [];
const box = (name, x, y, z, sx, sy, sz, material) =>
  boxes.push({
    name,
    translation: [x, y, z],
    scale: [sx, sy, sz],
    mesh: material,
  });
box("Sol salon", -2, 0, 0, 4, 0.15, 4, 0);
box("Sol cuisine", 2, 0, 0, 4, 0.15, 4, 0);
box("Mur arrière", 0, 1.35, -2, 8, 2.7, 0.12, 5);
box("Mur gauche", -4, 1.35, 0, 0.12, 2.7, 4, 5);
box("Mur droit", 4, 1.35, 0, 0.12, 2.7, 4, 5);
box("Séparation gauche", 0, 1.35, -1.35, 0.12, 2.7, 1.3, 0);
box("Séparation droite", 0, 1.35, 1.35, 0.12, 2.7, 1.3, 0);
box("Sofa", -2.9, 0.4, 0.8, 1.7, 0.65, 0.8, 1);
box("Dossier sofa", -2.9, 0.85, 1.15, 1.7, 0.4, 0.15, 1);
box("Table salon", -1.6, 0.38, 0.1, 1, 0.12, 0.65, 2);
for (const x of [-1.95, -1.25])
  for (const z of [-0.1, 0.3])
    box("Pied de table", x, 0.2, z, 0.08, 0.35, 0.08, 2);
box("Tapis", -1.7, 0.09, 0.25, 1.7, 0.02, 1.5, 4);
box("Meuble télévision", -2, 0.35, -1.65, 1.6, 0.55, 0.4, 2);
box("Télévision", -2, 1, -1.8, 1.35, 0.8, 0.08, 1);
box("Plan de travail", 2.3, 0.8, -1.6, 2.7, 0.18, 0.7, 0);
box("Meubles cuisine", 2.3, 0.4, -1.6, 2.6, 0.7, 0.65, 4);
box("Réfrigérateur", 3.5, 0.95, -0.5, 0.65, 1.8, 0.75, 5);
box("Îlot cuisine", 1.8, 0.5, 0.3, 1.4, 0.9, 0.7, 2);
box("Plateau îlot", 1.8, 1, 0.3, 1.5, 0.1, 0.8, 0);
box("Fenêtre salon", -2, 1.7, -1.92, 1.3, 1, 0.03, 4);
box("Fenêtre cuisine", 2, 1.7, -1.92, 1.3, 1, 0.03, 4);
const json = {
  asset: {
    version: "2.0",
    generator: "BARKA procedural fictitious demonstration",
  },
  extensionsUsed: ["KHR_materials_unlit"],
  scene: 0,
  scenes: [
    { name: "Démonstration schématique BARKA", nodes: boxes.map((_, i) => i) },
  ],
  nodes: boxes,
  materials: colors.map((color) => ({
    pbrMetallicRoughness: {
      baseColorFactor: color,
      metallicFactor: 0,
      roughnessFactor: 1,
    },
    extensions: { KHR_materials_unlit: {} },
  })),
  meshes: colors.map((_, material) => ({
    primitives: [
      { attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material },
    ],
  })),
  buffers: [{ byteLength: binary.length }],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: position.length, target: 34962 },
    {
      buffer: 0,
      byteOffset: position.length,
      byteLength: normal.length,
      target: 34962,
    },
    {
      buffer: 0,
      byteOffset: position.length + normal.length,
      byteLength: indices.length,
      target: 34963,
    },
  ],
  accessors: [
    {
      bufferView: 0,
      componentType: 5126,
      count: geometry.attributes.position.count,
      type: "VEC3",
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5],
    },
    {
      bufferView: 1,
      componentType: 5126,
      count: geometry.attributes.normal.count,
      type: "VEC3",
    },
    {
      bufferView: 2,
      componentType: 5123,
      count: geometry.index.count,
      type: "SCALAR",
    },
  ],
};
let text = Buffer.from(JSON.stringify(json));
text = Buffer.concat([text, Buffer.alloc((4 - (text.length % 4)) % 4, 32)]);
const bin = Buffer.concat([
  binary,
  Buffer.alloc((4 - (binary.length % 4)) % 4),
]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + text.length + bin.length, 8);
header.writeUInt32LE(text.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const bh = Buffer.alloc(8);
bh.writeUInt32LE(bin.length, 0);
bh.writeUInt32LE(0x004e4942, 4);
await writeFile(
  new URL("maison.glb", root),
  Buffer.concat([header, text, bh, bin]),
);
function intersect(origin, direction, min, max) {
  let near = 0,
    far = Infinity,
    normalAxis = 0;
  for (let a = 0; a < 3; a++) {
    if (Math.abs(direction[a]) < 1e-8) {
      if (origin[a] < min[a] || origin[a] > max[a]) return null;
      continue;
    }
    let one = (min[a] - origin[a]) / direction[a],
      two = (max[a] - origin[a]) / direction[a];
    if (one > two) [one, two] = [two, one];
    if (one > near) {
      near = one;
      normalAxis = a;
    }
    far = Math.min(far, two);
    if (near > far) return null;
  }
  return near > 0 ? { distance: near, axis: normalAxis } : null;
}
for (const room of ["salon", "cuisine"]) {
  const w = 2048,
    h = 1024,
    output = Buffer.alloc(w * h * 3);
  const furniture =
    room === "salon"
      ? [
          { min: [-3, 0.1, 0.5], max: [-0.2, 0.85, 2], color: [32, 69, 88] },
          {
            min: [-2, 0.1, -0.5],
            max: [-0.3, 0.55, 0.2],
            color: [154, 103, 57],
          },
          { min: [-2, 0.1, -3.6], max: [1, 0.6, -3.1], color: [116, 78, 48] },
          {
            min: [-1.8, 0.8, -3.8],
            max: [0.8, 2.2, -3.65],
            color: [20, 29, 38],
          },
        ]
      : [
          {
            min: [-3.9, 0.05, -3.8],
            max: [3.9, 1, -2.9],
            color: [54, 112, 103],
          },
          {
            min: [-1, 0.1, -0.4],
            max: [1.5, 1.05, 0.9],
            color: [168, 117, 64],
          },
          {
            min: [2.8, 0.1, 1.3],
            max: [3.8, 2.5, 2.5],
            color: [221, 227, 225],
          },
        ];
  for (let y = 0; y < h; y++) {
    const pitch = (0.5 - (y + 0.5) / h) * Math.PI,
      cp = Math.cos(pitch),
      dy = Math.sin(pitch);
    for (let x = 0; x < w; x++) {
      const yaw = ((x + 0.5) / w - 0.5) * Math.PI * 2,
        d = [Math.sin(yaw) * cp, dy, -Math.cos(yaw) * cp],
        o = [0, 1.6, 0];
      let t = Infinity,
        axis = 0;
      for (let a = 0; a < 3; a++) {
        const edge = a === 1 ? (d[a] > 0 ? 3.1 : 0) : d[a] > 0 ? 4 : -4,
          distance = (edge - o[a]) / d[a];
        if (distance > 0 && distance < t) {
          t = distance;
          axis = a;
        }
      }
      const hit = o.map((v, a) => v + d[a] * t);
      let color =
        axis === 1
          ? dy > 0
            ? [242, 237, 223]
            : (Math.floor(hit[0] * 2) + Math.floor(hit[2] * 2)) % 2 === 0
              ? [197, 171, 134]
              : [215, 192, 153]
          : room === "salon"
            ? [221, 213, 191]
            : [216, 226, 218];
      if (
        axis === 2 &&
        d[2] < 0 &&
        hit[1] > 1.1 &&
        hit[1] < 2.7 &&
        Math.abs(hit[0] - 1.6) < 1.15
      )
        color = [109, 173, 180];
      if (
        axis === 0 &&
        ((room === "salon" && d[0] > 0) || (room === "cuisine" && d[0] < 0)) &&
        Math.abs(hit[2]) < 0.8 &&
        hit[1] < 2.5
      )
        color = [180, 125, 66];
      let shade = axis === 0 ? 0.82 : axis === 2 ? 0.94 : 1;
      for (const f of furniture) {
        const b = intersect(o, d, f.min, f.max);
        if (b && b.distance < t) {
          t = b.distance;
          color = f.color;
          shade = b.axis === 1 ? 1.1 : b.axis === 0 ? 0.75 : 0.9;
        }
      }
      const index = (y * w + x) * 3;
      for (let c = 0; c < 3; c++)
        output[index + c] = Math.min(255, Math.round(color[c] * shade));
    }
  }
  await sharp(output, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality: 90 })
    .toFile(new URL(`${room}.jpg`, root).pathname);
}
await writeFile(
  new URL("plan.svg", root),
  '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="260" viewBox="0 0 480 260"><rect width="480" height="260" rx="16" fill="#fff"/><g fill="#f2f6fa" stroke="#334155" stroke-width="5"><rect x="20" y="20" width="440" height="220"/><path d="M240 20v75m0 70v75"/></g><g font-family="sans-serif" font-size="22" fill="#334155"><text x="80" y="80">Salon</text><text x="300" y="80">Cuisine</text></g><g fill="#cbd5e1"><rect x="40" y="170" width="110" height="45"/><rect x="290" y="180" width="130" height="35"/></g></svg>',
);
console.log(
  "Démonstration fictive générée : deux panoramas 2:1, modèle GLB et plan schématique.",
);
