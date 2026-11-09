import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { AppError } from "@/lib/server/errors";
import { hostedMediaRelay } from "./limits";
function localAllowed() {
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(
    new URL(process.env.AUTH_URL ?? "http://localhost:3000").hostname,
  );
  if (
    process.env.NODE_ENV === "production" &&
    !(process.env.MEDIA_LOCAL_PREVIEW === "true" && local)
  )
    throw new AppError(
      503,
      "STORAGE_CONFIGURATION",
      "Configurez le stockage S3 privé avant d’utiliser les médias sur cet environnement.",
    );
}
function localPath(key: string) {
  if (!/^local\/[a-f0-9-]+\.(jpg|glb)$/.test(key))
    throw new Error("Clé invalide");
  // Private uploads are runtime files, never assets to include in the server bundle.
  return resolve(
    /* turbopackIgnore: true */
    process.cwd(),
    process.env.MEDIA_LOCAL_DIR ?? ".barka-media",
    key.slice(6),
  );
}
export function storageClient() {
  if (!process.env.S3_BUCKET)
    throw new AppError(
      503,
      "STORAGE_CONFIGURATION",
      "Le stockage objet n’est pas configuré.",
    );
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT,
    ...(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          },
        }
      : {}),
  });
}
export async function putMedia(
  id: string,
  extension: "jpg" | "glb",
  body: Buffer,
  mime: string,
) {
  if (hostedMediaRelay() && body.length > 4 * 1024 * 1024)
    throw new AppError(
      413,
      "HOST_MEDIA_LIMIT",
      "Après traitement, le média dépasse 4 Mo. Réduisez sa résolution avant l’envoi.",
    );
  const provider =
    process.env.MEDIA_DRIVER ?? (process.env.S3_BUCKET ? "s3" : "local");
  if (provider === "local") {
    localAllowed();
    const key = `local/${id}.${extension}`,
      path = localPath(key);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await writeFile(path, body, { mode: 0o600, flag: "wx" });
    return key;
  }
  if (provider !== "s3") throw new Error("Stockage non reconnu");
  const key = `s3/barka/${id}.${extension}`;
  await storageClient().send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key.slice(3),
      Body: body,
      ContentType: mime,
      CacheControl: "private, no-store",
    }),
  );
  return key;
}
export async function readMedia(key: string) {
  if (key.startsWith("local/")) {
    localAllowed();
    return readFile(localPath(key));
  }
  if (!/^s3\/barka\/[a-f0-9-]+\.(jpg|glb)$/.test(key))
    throw new Error("Clé invalide");
  const object = await storageClient().send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key.slice(3) }),
  );
  if (!object.Body) throw new Error("Objet absent");
  return Buffer.from(await object.Body.transformToByteArray());
}
export async function removeMedia(key: string) {
  if (key.startsWith("local/")) {
    localAllowed();
    await unlink(localPath(key)).catch(() => {});
    return;
  }
  if (/^s3\/barka\/[a-f0-9-]+\.(jpg|glb)$/.test(key))
    await storageClient().send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key.slice(3),
      }),
    );
}
