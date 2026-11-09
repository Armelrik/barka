import assert from "node:assert/strict";
import { readUpload } from "../src/modules/media/service";
import { putMedia } from "../src/modules/media/storage";
async function main() {
  process.env.VERCEL = "1";
  const over = new Uint8Array(5 * 1024 * 1024);
  await assert.rejects(
    readUpload(
      new Request("http://localhost/upload", {
        method: "POST",
        headers: { "content-type": "multipart/form-data; boundary=fixture" },
        body: over,
      }),
    ),
    (e: unknown) =>
      !!e && typeof e === "object" && "status" in e && e.status === 413,
  );
  const form = new FormData();
  form.set("kind", "PHOTO");
  form.set(
    "file",
    new File([new Uint8Array(4 * 1024 * 1024 + 1)], "photo.jpg", {
      type: "image/jpeg",
    }),
  );
  await assert.rejects(
    readUpload(
      new Request("http://localhost/upload", { method: "POST", body: form }),
    ),
    (e: unknown) =>
      !!e && typeof e === "object" && "status" in e && e.status === 413,
  );
  await assert.rejects(
    putMedia("fixture", "jpg", Buffer.from(over), "image/jpeg"),
    (e: unknown) =>
      !!e && typeof e === "object" && "status" in e && e.status === 413,
  );
  console.info(
    "Limites Vercel vérifiées : corps sans Content-Length, fichier de plus de 4 Mo et résultat traité trop grand refusés avant stockage.",
  );
}
main().catch(() => {
  console.error("Échec de vérification des limites de médias hébergés.");
  process.exitCode = 1;
});
