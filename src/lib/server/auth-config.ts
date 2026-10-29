import type { SessionOptions } from "iron-session";
import { AppError } from "./errors";
export const sessionTtl = 8 * 60 * 60;
export function getAuthConfig() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32)
    throw new AppError(
      503,
      "AUTH_CONFIGURATION",
      "La connexion n’est pas encore configurée sur cet environnement.",
    );
  let url: URL;
  try {
    url = new URL(process.env.AUTH_URL ?? "http://localhost:3000");
  } catch {
    throw new AppError(
      503,
      "AUTH_CONFIGURATION",
      "La connexion n’est pas encore configurée sur cet environnement.",
    );
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:"))
    throw new AppError(
      503,
      "AUTH_CONFIGURATION",
      "Une adresse HTTPS est requise pour la connexion.",
    );
  return { secret, origin: url.origin, secure: url.protocol === "https:" };
}
export function getSessionOptions(): SessionOptions {
  const config = getAuthConfig();
  return {
    password: config.secret,
    cookieName: config.secure ? "__Host-barka.session" : "barka.session",
    ttl: sessionTtl,
    cookieOptions: {
      httpOnly: true,
      secure: config.secure,
      sameSite: "lax",
      path: "/",
      maxAge: sessionTtl,
    },
  };
}
