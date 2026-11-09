import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  bootstrapInput,
  bootstrapProduction,
} from "../src/modules/deployment/bootstrap";
config({ path: ".env.bootstrap", quiet: true });
config({ quiet: true });
async function main() {
  const input = bootstrapInput(process.env),
    url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Connexion absente");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, max: 1 }),
  });
  try {
    const result = await bootstrapProduction(db, input);
    console.info(
      result.created
        ? "Initialisation terminée : administrateur et commercial par défaut créés. Aucun secret affiché."
        : "Initialisation déjà effectuée : comptes et mots de passe conservés.",
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Initialisation refusée ou indisponible : vérifier les variables BOOTSTRAP_*, les migrations et les conflits d’identifiants. Aucun compte existant n’est promu ni mot de passe réinitialisé.",
  );
  process.exitCode = 1;
});
