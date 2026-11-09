import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { retireDemoAccounts } from "../src/modules/deployment/retire-demo";
async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Connexion manquante");
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url, max: 1 }),
  });
  try {
    const result = await retireDemoAccounts(
      db,
      process.env.BARKA_COMPANY_CODE ?? "",
      process.argv.includes("--apply"),
    );
    console.info(
      `${result.applied ? "Retrait effectué" : "Simulation sans modification"} : ${result.matched} comptes fictifs reconnus, ${result.active} compte(s) actif(s) ${result.applied ? "suspendu(s)" : "à suspendre"}, ${result.sessions} session(s) ${result.applied ? "révoquée(s)" : "à révoquer"}. Aucun compte réel ni bien supprimé.`,
    );
  } finally {
    await db.$disconnect();
  }
}
main().catch(() => {
  console.error(
    "Retrait refusé ou indisponible : vérifier les comptes initiaux et la correspondance exacte des comptes fictifs. Aucun secret affiché.",
  );
  process.exitCode = 1;
});
