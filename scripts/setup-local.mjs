import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";

let content;
try {
  content = await readFile(new URL("../.env", import.meta.url), "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  content = await readFile(new URL("../.env.example", import.meta.url), "utf8");
}
for (const key of ["AUTH_SECRET", "DEMO_PASSWORD"]) {
  const pattern = new RegExp(`^${key}=(.*)$`, "m");
  const existing = content.match(pattern)?.[1]?.trim();
  if (!existing || existing === '""' || existing === "''") {
    const line = `${key}=${randomBytes(key === "AUTH_SECRET" ? 48 : 24).toString("hex")}`;
    content = pattern.test(content)
      ? content.replace(pattern, line)
      : `${content.trimEnd()}\n${line}\n`;
  }
}
if (process.argv.includes("--prisma-local"))
  content = content.replace(
    /^DATABASE_URL=.*$/m,
    "DATABASE_URL=postgres://postgres:postgres@localhost:51234/template1?sslmode=disable",
  );
if (process.argv.includes("--prisma-local"))
  content = /^DATABASE_POOL_MAX=/m.test(content)
    ? content.replace(/^DATABASE_POOL_MAX=.*$/m, "DATABASE_POOL_MAX=1")
    : `${content.trimEnd()}\nDATABASE_POOL_MAX=1\n`;
await writeFile(new URL("../.env", import.meta.url), content, { mode: 0o600 });
console.info(
  "Configuration locale prête dans .env. Le secret reste privé et n’est pas affiché.",
);
