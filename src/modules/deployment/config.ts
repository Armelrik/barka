export function deploymentProblems(env: Record<string, string | undefined>) {
  const errors: string[] = [];
  const postgres = (key: string, direct = false) => {
    try {
      const url = new URL(env[key] ?? "");
      if (
        !["postgres:", "postgresql:"].includes(url.protocol) ||
        ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      )
        throw new Error();
      if (
        !url.username ||
        !url.password ||
        !["require", "verify-full", "verify-ca"].includes(
          url.searchParams.get("sslmode") ?? "",
        )
      )
        throw new Error();
      if (direct && url.hostname.includes("-pooler"))
        errors.push(
          `${key} doit utiliser la connexion directe Neon, sans -pooler.`,
        );
    } catch {
      errors.push(
        `${key} doit être une connexion PostgreSQL distante authentifiée avec TLS.`,
      );
    }
  };
  postgres("DATABASE_URL");
  postgres("DIRECT_URL", true);
  try {
    const runtime = new URL(env.DATABASE_URL ?? ""),
      direct = new URL(env.DIRECT_URL ?? "");
    if (
      runtime.hostname.endsWith(".neon.tech") &&
      direct.hostname.endsWith(".neon.tech") &&
      (runtime.hostname.replace("-pooler.", ".") !== direct.hostname ||
        runtime.pathname !== direct.pathname ||
        runtime.username !== direct.username)
    )
      errors.push(
        "DATABASE_URL et DIRECT_URL doivent cibler la même base et la même branche Neon.",
      );
  } catch {
    /* Invalid URLs are reported above without logging values. */
  }
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32)
    errors.push("AUTH_SECRET doit contenir au moins 32 caractères.");
  try {
    const url = new URL(
      env.AUTH_URL ||
        (env.VERCEL_ENV === "preview" && env.VERCEL_URL
          ? `https://${env.VERCEL_URL}`
          : ""),
    );
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      throw new Error();
  } catch {
    errors.push(
      "AUTH_URL doit être l’origine HTTPS du site (ou VERCEL_URL pour une preview).",
    );
  }
  if (!env.BARKA_COMPANY_CODE || env.BARKA_COMPANY_CODE.includes("DEMO"))
    errors.push("BARKA_COMPANY_CODE doit identifier la société de production.");
  if (!["demo", "database"].includes(env.CATALOG_MODE ?? ""))
    errors.push("CATALOG_MODE doit être demo ou database.");
  if (
    env.MEDIA_DRIVER !== "s3" ||
    !env.S3_BUCKET ||
    !env.S3_REGION ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY
  )
    errors.push(
      "Le stockage S3 privé doit être configuré (MEDIA_DRIVER, S3_BUCKET, S3_REGION et clés S3).",
    );
  if (env.MEDIA_LOCAL_PREVIEW === "true")
    errors.push(
      "MEDIA_LOCAL_PREVIEW est réservé au Mac et doit être false sur Vercel.",
    );
  if (env.NEXT_PUBLIC_MEDIA_MAX_MB !== "4")
    errors.push(
      "NEXT_PUBLIC_MEDIA_MAX_MB doit valoir 4 sur Vercel pour les médias relayés.",
    );
  if (env.DEMO_PASSWORD)
    errors.push("Retirer DEMO_PASSWORD de l’environnement hébergé.");
  if (Object.keys(env).some((key) => key.startsWith("BOOTSTRAP_") && env[key]))
    errors.push(
      "Retirer les variables BOOTSTRAP_* de Vercel ; l’initialisation se lance séparément.",
    );
  if (
    env.REGISTRATION_ENABLED === "true" &&
    env.LEGAL_DOCUMENTS_APPROVED !== "true"
  )
    errors.push(
      "Valider les documents légaux avant d’ouvrir les inscriptions.",
    );
  if (env.AUTH_TRUST_PROXY_HEADERS === "true")
    errors.push(
      "Conserver AUTH_TRUST_PROXY_HEADERS=false tant que les en-têtes de l’ingress ne sont pas vérifiés.",
    );
  return errors;
}
