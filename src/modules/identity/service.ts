import "server-only";
import { compare, hash } from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { registrationSchema, loginSchema, consentVersions } from "./validation";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import { getAuthConfig } from "@/lib/server/auth-config";
import { insertSession } from "@/lib/server/session";
// Same bcrypt work for an unknown account; this is not an actual account credential.
const dummyPasswordHash = hash("BARKA timing comparison placeholder only", 12);
export async function registerClient(input: unknown) {
  getAuthConfig();
  const data = registrationSchema.parse(input);
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.REGISTRATION_ENABLED !== "true" ||
      process.env.LEGAL_DOCUMENTS_APPROVED !== "true")
  )
    throw new AppError(
      503,
      "REGISTRATION_CLOSED",
      "Les inscriptions ne sont pas encore ouvertes sur cet environnement.",
    );
  const code =
    process.env.BARKA_COMPANY_CODE ??
    (process.env.NODE_ENV !== "production" ? "BARKA-DEMO" : "");
  if (!code)
    throw new AppError(
      503,
      "REGISTRATION_CONFIGURATION",
      "Les inscriptions ne sont pas encore disponibles.",
    );
  const passwordHash = await hash(data.password, 12);
  try {
    return await getDb().$transaction(async (tx) => {
      const company = await tx.company.findUnique({
        where: { code },
        include: { defaultCommercial: { include: { role: true } } },
      });
      const parent = company?.defaultCommercial;
      const clientRole = await tx.role.findUnique({
        where: { code: "CLIENT" },
      });
      if (
        !company ||
        !parent ||
        parent.companyId !== company.id ||
        parent.status !== "ACTIVE" ||
        parent.role.code !== "DEFAULT_COMMERCIAL" ||
        !clientRole
      )
        throw new AppError(
          503,
          "REGISTRATION_CONFIGURATION",
          "Les inscriptions ne sont pas encore disponibles.",
        );
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          passwordHash,
          companyId: company.id,
          roleId: clientRole.id,
          parentLink: { create: { parentId: parent.id } },
          clientProfile: { create: {} },
          consents: {
            create: Object.entries(consentVersions).map(
              ([purpose, version]) => ({ purpose, version }),
            ),
          },
        },
      });
      const token = await insertSession(tx, user.id);
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          companyId: company.id,
          action: "ACCOUNT_REGISTERED",
          targetType: "User",
          targetId: user.id,
          metadata: { role: "CLIENT", consentVersions },
        },
      });
      return token;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new AppError(
        409,
        "ACCOUNT_EXISTS",
        "Un compte utilise déjà ces informations. Essayez de vous connecter.",
      );
    throw error;
  }
}
export async function authenticate(input: unknown) {
  const data = loginSchema.parse(input);
  const user = await getDb().user.findUnique({
    where: data.identifier.includes("@")
      ? { email: data.identifier }
      : { phone: data.identifier },
    select: { id: true, passwordHash: true, status: true, companyId: true },
  });
  const valid = await compare(
    data.password,
    user?.passwordHash ?? (await dummyPasswordHash),
  );
  if (!user || !valid || user.status !== "ACTIVE")
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Identifiant ou mot de passe incorrect.",
    );
  return getDb().$transaction(async (tx) => {
    // Recheck after password verification, inside the transaction creating the session.
    const active = await tx.user.findUnique({
      where: { id: user.id },
      select: { status: true, passwordHash: true },
    });
    if (
      !active ||
      active.status !== "ACTIVE" ||
      active.passwordHash !== user.passwordHash
    )
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "Identifiant ou mot de passe incorrect.",
      );
    const token = await insertSession(tx, user.id);
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        companyId: user.companyId,
        action: "AUTH_LOGIN",
        targetType: "User",
        targetId: user.id,
      },
    });
    return token;
  });
}
