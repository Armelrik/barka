import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import type { Prisma } from "@/generated/prisma/client";
import type { Principal } from "@/modules/identity/policy";
import { getSessionOptions, sessionTtl } from "./auth-config";
import { getDb } from "./db";
import { AppError } from "./errors";

export const authUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  status: true,
  phoneVerifiedAt: true,
  companyId: true,
  company: { select: { name: true, countryId: true } },
  role: {
    select: {
      code: true,
      permissions: { select: { permission: { select: { code: true } } } },
    },
  },
} satisfies Prisma.UserSelect;
export type AuthenticatedUser = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;
type CookieData = { token?: string };
export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export async function insertSession(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const token = randomBytes(32).toString("hex");
  await tx.authSession.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() + sessionTtl * 1000),
    },
  });
  return token;
}
export async function saveSession(token: string) {
  const session = await getIronSession<CookieData>(
    await cookies(),
    getSessionOptions(),
  );
  if (session.token)
    await getDb().authSession.deleteMany({
      where: { tokenHash: hashSessionToken(session.token) },
    });
  session.token = token;
  await session.save();
}
export async function currentUser(): Promise<AuthenticatedUser | null> {
  const jar = await cookies();
  if (!jar.has("barka.session") && !jar.has("__Host-barka.session"))
    return null;
  const session = await getIronSession<CookieData>(jar, getSessionOptions());
  if (!session.token || !/^[a-f0-9]{64}$/.test(session.token)) return null;
  const record = await getDb().authSession.findUnique({
    where: { tokenHash: hashSessionToken(session.token) },
    select: { expiresAt: true, user: { select: authUserSelect } },
  });
  return record &&
    record.expiresAt > new Date() &&
    record.user.status === "ACTIVE"
    ? record.user
    : null;
}
export function principalFor(user: AuthenticatedUser): Principal {
  return {
    id: user.id,
    companyId: user.companyId,
    countryId: user.company.countryId,
    role: user.role.code,
    status: user.status,
    permissions: user.role.permissions.map((grant) => grant.permission.code),
  };
}
export async function requireUser(permission?: string) {
  const user = await currentUser();
  if (!user)
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Connectez-vous pour accéder à votre espace.",
    );
  if (permission && !principalFor(user).permissions.includes(permission))
    throw new AppError(
      403,
      "FORBIDDEN",
      "Vous n’avez pas accès à cette fonctionnalité.",
    );
  return user;
}
export async function destroySession() {
  const session = await getIronSession<CookieData>(
    await cookies(),
    getSessionOptions(),
  );
  try {
    if (session.token)
      await getDb().$transaction(async (tx) => {
        const tokenHash = hashSessionToken(session.token!);
        const record = await tx.authSession.findUnique({
          where: { tokenHash },
          select: {
            id: true,
            userId: true,
            user: { select: { companyId: true } },
          },
        });
        if (record) {
          await tx.authSession.deleteMany({ where: { id: record.id } });
          await tx.auditLog.create({
            data: {
              actorId: record.userId,
              companyId: record.user.companyId,
              action: "AUTH_LOGOUT",
              targetType: "AuthSession",
              targetId: record.id,
            },
          });
        }
      });
  } finally {
    session.destroy();
  }
}
