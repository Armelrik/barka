import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import {
  storageClient,
  putMedia,
  readMedia,
  removeMedia,
} from "../src/modules/media/storage";
config({ path: ".env.vercel", quiet: true });
async function main() {
  const missing = [
    "S3_ENDPOINT",
    "S3_REGION",
    "S3_BUCKET",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
  ].filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(
      `Paramètres Neon Object Storage à renseigner dans .env.vercel : ${missing.join(", ")}. Les identifiants PostgreSQL ne les remplacent pas.`,
    );
    process.exitCode = 1;
    return;
  }
  const endpoint = new URL(process.env.S3_ENDPOINT!);
  if (
    endpoint.protocol !== "https:" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  )
    throw new Error("Endpoint HTTPS requis");
  if (process.env.MEDIA_DRIVER !== "s3")
    throw new Error("MEDIA_DRIVER doit valoir s3");
  const client = storageClient();
  try {
    await client.send(new HeadBucketCommand({ Bucket: process.env.S3_BUCKET }));
  } finally {
    client.destroy();
  }
  console.info(
    "Connexion au bucket Neon réussie. Ce contrôle seul ne vérifie pas sa confidentialité.",
  );
  if (!process.argv.includes("--probe")) return;
  let key: string | undefined;
  try {
    const fixture = await readFile(
      new URL("../public/afriloc/house1.jpg", import.meta.url),
    );
    key = await putMedia(randomUUID(), "jpg", fixture, "image/jpeg");
    const returned = await readMedia(key);
    if (!returned.equals(fixture))
      throw new Error("Lecture différente du fichier de test");
    console.info("Relecture du fichier de test conforme.");
    const anonymous = new URL(endpoint);
    anonymous.pathname = `${endpoint.pathname.replace(/\/$/, "")}/${encodeURIComponent(process.env.S3_BUCKET!)}/${key.slice(3).split("/").map(encodeURIComponent).join("/")}`;
    const response = await fetch(anonymous, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    console.info(`Lecture anonyme : HTTP ${response.status}.`);
    await response.body?.cancel();
    if (![401, 403, 404].includes(response.status))
      throw new Error("Le refus de lecture anonyme n’a pas été confirmé");
    console.info(
      "Dépôt et lecture via le connecteur Barka vérifiés ; lecture anonyme du fichier de test refusée.",
    );
  } finally {
    if (key) {
      await removeMedia(key);
      console.info("Fichier de test supprimé ; aucun média existant modifié.");
    }
  }
}
main().catch((error: unknown) => {
  if (error && typeof error === "object") {
    const safe = error as {
      name?: string;
      $metadata?: { httpStatusCode?: number };
      cause?: { code?: string };
    };
    console.error("Diagnostic limité :", {
      code: safe.name,
      status: safe.$metadata?.httpStatusCode,
      networkCode: safe.cause?.code,
    });
  }
  console.error(
    "Vérification du stockage incomplète : contrôler endpoint, droits storage:read/storage:write et accès privé. Aucun secret affiché.",
  );
  process.exitCode = 1;
});
