import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const url = process.env.DATABASE_URL;
const password = process.env.DEMO_PASSWORD;
if (
  process.env.NODE_ENV === "production" ||
  !url ||
  !["localhost", "127.0.0.1", "[::1]"].includes(new URL(url).hostname)
)
  throw new Error(
    "Réinitialisation réservée aux comptes fictifs d'une base locale, hors production.",
  );
if (
  !password ||
  password.length < 12 ||
  Buffer.byteLength(password, "utf8") > 72
)
  throw new Error(
    "Définir DEMO_PASSWORD dans .env : 12 caractères minimum, 72 octets maximum.",
  );
const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: url, max: 1 }),
});
async function main() {
  const emails = [
    "super_admin",
    "admin",
    "supervisor",
    "manager",
    "commercial",
    "default_commercial",
    "client",
  ].map((role) => `${role}@barka.example`);
  const passwordHash = await hash(password!, 12);
  await db.$transaction(async (tx) => {
    const users = await tx.user.findMany({
      where: {
        company: { code: "BARKA-DEMO" },
        email: { in: emails },
        phone: { startsWith: "+2260" },
        firstName: "Compte",
        lastName: { startsWith: "Démo " },
      },
      select: { id: true, companyId: true },
    });
    if (users.length !== 7)
      throw new Error(
        "Comptes de démonstration attendus absents ou modifiés. Vérifier le seed.",
      );
    const ids = users.map((user) => user.id);
    await tx.authSession.deleteMany({ where: { userId: { in: ids } } });
    await tx.user.updateMany({
      where: { id: { in: ids } },
      data: { passwordHash },
    });
    await tx.auditLog.createMany({
      data: users.map((user) => ({
        companyId: user.companyId,
        action: "DEMO_PASSWORD_RESET",
        targetType: "User",
        targetId: user.id,
      })),
    });
  });
  console.info(
    "Les 7 comptes fictifs utilisent maintenant DEMO_PASSWORD de .env. Leurs anciennes sessions ont été révoquées. Aucun secret affiché.",
  );
}
main()
  .catch(() => {
    console.error(
      "Réinitialisation des comptes de démonstration impossible. Vérifier la base locale et le seed.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
