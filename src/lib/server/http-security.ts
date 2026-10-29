import { getAuthConfig } from "./auth-config";
import { AppError } from "./errors";
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = getAuthConfig().origin;
  let localAlias = false;
  try {
    const configured = new URL(expected),
      supplied = new URL(origin ?? "");
    const local = (hostname: string) =>
      ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
    localAlias =
      supplied.origin === origin &&
      local(configured.hostname) &&
      local(supplied.hostname) &&
      supplied.port === configured.port &&
      supplied.protocol === configured.protocol;
  } catch {
    /* Missing or malformed origins are rejected below. */
  }
  if (
    (origin !== expected && !localAlias) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new AppError(
      403,
      "ORIGIN_REJECTED",
      "Cette demande n’est pas autorisée.",
    );
}
export async function readJsonBody(request: Request): Promise<unknown> {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new AppError(
      415,
      "CONTENT_TYPE",
      "Envoyez les informations au format JSON.",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new AppError(400, "INVALID_BODY", "La demande est vide.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > 8192) {
        await reader.cancel();
        throw new AppError(
          413,
          "BODY_TOO_LARGE",
          "La demande est trop volumineuse.",
        );
      }
      chunks.push(value);
    }
    const buffer = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }
    try {
      return JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(buffer),
      );
    } catch {
      throw new AppError(400, "INVALID_JSON", "La demande est invalide.");
    }
  } finally {
    reader.releaseLock();
  }
}
