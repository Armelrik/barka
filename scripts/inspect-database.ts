import "dotenv/config";
import { Pool } from "pg";
import { readdir } from "node:fs/promises";
async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Connexion absente");
  const pool = new Pool({
    connectionString: url,
    max: 1,
    connectionTimeoutMillis: 10000,
    statement_timeout: 10000,
  });
  try {
    const tables = await pool.query<{ name: string }>(
      "SELECT table_name AS name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'",
    );
    console.info(`Connexion réussie. ${tables.rowCount} table(s) dans public.`);
    const names = new Set(tables.rows.map((r) => r.name));
    if (names.has("_prisma_migrations")) {
      const history = await pool.query<{
        migration_name: string;
        finished_at: Date | null;
        rolled_back_at: Date | null;
      }>(
        'SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations"',
      );
      const finished = new Set(
        history.rows.filter((r) => r.finished_at).map((r) => r.migration_name),
      );
      const pending = (await readdir("prisma/migrations")).filter(
        (name) => /^\d+_/.test(name) && !finished.has(name),
      );
      console.info(
        `Migrations appliquées : ${finished.size}. En attente : ${pending.join(", ") || "aucune"}.`,
      );
      if (history.rows.some((r) => !r.finished_at && !r.rolled_back_at))
        throw new Error(
          "Une migration échouée doit être examinée avant déploiement.",
        );
    } else if (tables.rowCount)
      console.info(
        "Base existante sans historique Prisma : ne pas lancer migrate deploy sans vérifier le schéma et préparer une baseline.",
      );
    else console.info("Base vide, prête pour les migrations versionnées.");
    if (names.has("User") && names.has("Role")) {
      const roles = await pool.query<{ code: string; count: string }>(
        'SELECT r.code,count(u.id)::text AS count FROM "Role" r LEFT JOIN "User" u ON u."roleId"=r.id GROUP BY r.code ORDER BY r.code',
      );
      for (const row of roles.rows)
        console.info(`${row.code} : ${row.count} compte(s).`);
      const demos = await pool.query<{ count: string }>(
        "SELECT count(*)::text AS count FROM \"User\" WHERE email LIKE '%@barka.example' AND status='ACTIVE'",
      );
      console.info(`Comptes de démonstration actifs : ${demos.rows[0].count}.`);
    }
  } finally {
    await pool.end();
  }
}
main().catch(() => {
  console.error(
    "Inspection impossible ou migration échouée détectée. Vérifier connexion, TLS et historique ; aucun secret affiché.",
  );
  process.exitCode = 1;
});
