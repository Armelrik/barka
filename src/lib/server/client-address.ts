import { isIP } from "node:net";
export function rateLimitAddress(
  headers: Headers,
  env: Record<string, string | undefined>,
) {
  const value =
    env.VERCEL === "1"
      ? headers.get("x-vercel-forwarded-for")
      : env.AUTH_TRUST_PROXY_HEADERS === "true"
        ? headers.get("x-forwarded-for")
        : null;
  const ip = value?.split(",")[0]?.trim();
  return ip && isIP(ip) ? ip : "untrusted-shared-ingress";
}
