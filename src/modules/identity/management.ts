import "server-only";
import { hash } from "bcryptjs";
import { Prisma, type RoleCode } from "@/generated/prisma/client";
import { getDb } from "@/lib/server/db";
import { AppError } from "@/lib/server/errors";
import { lockIdentity } from "@/lib/server/identity-lock";
import { nextAgentIdentifier } from "@/lib/server/agent-number";
import {
  authUserSelect,
  principalFor,
  type AuthenticatedUser,
} from "@/lib/server/session";
import { canManageUser, canAssignRole, roleLevels } from "./policy";
import {
  createManagedUserSchema,
  updateManagedUserSchema,
  parentQuerySchema,
  managedPasswordSchema,
} from "./validation";
import { managedUserWhere } from "./access";

type Tx = Prisma.TransactionClient;
const parentSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: { select: { code: true } },
} satisfies Prisma.UserSelect;
const detailSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  status: true,
  updatedAt: true,
  createdAt: true,
  companyId: true,
  company: { select: { id: true, name: true, countryId: true } },
  role: { select: { code: true } },
  parentLink: { select: { parent: { select: parentSelect } } },
  agentProfile: { select: { identifier: true } },
  defaultForCompany: { select: { id: true } },
  _count: { select: { children: true } },
} satisfies Prisma.UserSelect;
type Target = Prisma.UserGetPayload<{ select: typeof detailSelect }>;
const notFound = () =>
  new AppError(404, "NOT_FOUND", "Cet utilisateur est introuvable.");
function conflict(message: string, code = "HIERARCHY_CONFLICT") {
  return new AppError(409, code, message);
}

async function freshActor(tx: Tx, id: string) {
  const actor = await tx.user.findUnique({
    where: { id },
    select: authUserSelect,
  });
  if (!actor || actor.status !== "ACTIVE")
    throw new AppError(
      401,
      "UNAUTHENTICATED",
      "Reconnectez-vous pour continuer.",
    );
  if (!principalFor(actor).permissions.includes("users.manage"))
    throw new AppError(
      403,
      "FORBIDDEN",
      "Vous n’avez pas accès à la gestion des utilisateurs.",
    );
  return actor;
}
async function branchIds(tx: Tx, id: string) {
  // Path tracking stops existing cycles; valid role chains contain at most seven users.
  const rows = await tx.$queryRaw<{ id: string }[]>`
    WITH RECURSIVE branch (id,path) AS (
      SELECT u.id, ARRAY[u.id] FROM "User" u WHERE u.id=${id}
      UNION ALL
      SELECT h."childId",branch.path || h."childId" FROM branch
      JOIN "UserHierarchy" h ON h."parentId"=branch.id
      WHERE NOT h."childId"=ANY(branch.path)
    ) SELECT DISTINCT id FROM branch`;
  return rows.map((r) => r.id);
}
async function targetFor(tx: Tx, actor: AuthenticatedUser, id: string) {
  const target = await tx.user.findUnique({
    where: { id },
    select: detailSelect,
  });
  const scope =
    actor.role.code === "SUPER_ADMIN"
      ? new Set<string>()
      : new Set(await branchIds(tx, actor.id));
  if (
    !target ||
    !canManageUser(
      principalFor(actor),
      {
        id: target.id,
        companyId: target.companyId,
        countryId: target.company.countryId,
        role: target.role.code,
      },
      scope,
    )
  )
    throw notFound();
  return target;
}
function dto(target: Target) {
  return {
    id: target.id,
    firstName: target.firstName,
    lastName: target.lastName,
    phone: target.phone,
    email: target.email,
    status: target.status,
    role: target.role.code,
    companyId: target.companyId,
    companyName: target.company.name,
    parent: target.parentLink?.parent
      ? {
          id: target.parentLink.parent.id,
          firstName: target.parentLink.parent.firstName,
          lastName: target.parentLink.parent.lastName,
          role: target.parentLink.parent.role.code,
        }
      : null,
    createdAt: target.createdAt.toISOString(),
    updatedAt: target.updatedAt.toISOString(),
    agentIdentifier: target.agentProfile?.identifier ?? null,
    isDefaultCommercial: !!target.defaultForCompany,
    childrenCount: target._count.children,
  };
}
export type ManagedUserDetail = ReturnType<typeof dto>;

async function assertParent(
  tx: Tx,
  actor: AuthenticatedUser,
  child: { id?: string; companyId: string; role: RoleCode },
  parentId: string | null,
) {
  if (parentId === null) {
    if (actor.role.code !== "SUPER_ADMIN" || child.role !== "ADMIN")
      throw conflict("Un responsable actif est obligatoire.");
    return;
  }
  const parent = await tx.user.findUnique({
    where: { id: parentId },
    select: { ...parentSelect, companyId: true, status: true },
  });
  if (
    !parent ||
    parent.status !== "ACTIVE" ||
    parent.companyId !== child.companyId ||
    roleLevels[parent.role.code] <= roleLevels[child.role]
  )
    throw conflict(
      "Choisissez un responsable actif, de la même société et d’un niveau supérieur.",
    );
  if (
    actor.role.code !== "SUPER_ADMIN" &&
    parent.id !== actor.id &&
    !(await branchIds(tx, actor.id)).includes(parent.id)
  )
    throw new AppError(
      403,
      "PARENT_FORBIDDEN",
      "Ce rattachement sort de votre équipe autorisée.",
    );
  if (child.id && (await branchIds(tx, child.id)).includes(parentId))
    throw conflict(
      "Un utilisateur ne peut pas être rattaché à lui-même ou à son équipe descendante.",
      "HIERARCHY_CYCLE",
    );
  // Validate the full ancestor chain, including existing corruption and maximum depth.
  const seen = new Set(child.id ? [child.id] : []);
  let next: string | null = parentId,
    lower = roleLevels[child.role],
    depth = 1;
  while (next) {
    if (seen.has(next) || ++depth > 7)
      throw conflict(
        "Ce rattachement créerait une hiérarchie invalide.",
        "HIERARCHY_CYCLE",
      );
    seen.add(next);
    const node: {
      companyId: string;
      role: { code: RoleCode };
      parentLink: { parentId: string } | null;
    } | null = await tx.user.findUnique({
      where: { id: next },
      select: {
        companyId: true,
        role: { select: { code: true } },
        parentLink: { select: { parentId: true } },
      },
    });
    if (
      !node ||
      node.companyId !== child.companyId ||
      roleLevels[node.role.code] <= lower
    )
      throw conflict(
        "La hiérarchie existante doit être corrigée avant ce rattachement.",
      );
    lower = roleLevels[node.role.code];
    next = node.parentLink?.parentId ?? null;
  }
}
async function ensureProfile(tx: Tx, id: string, role: RoleCode) {
  if (role === "CLIENT")
    await tx.clientProfile.upsert({
      where: { userId: id },
      create: { userId: id },
      update: {},
    });
  if (role === "COMMERCIAL" || role === "DEFAULT_COMMERCIAL") {
    if (
      !(await tx.agentProfile.findUnique({
        where: { userId: id },
        select: { id: true },
      }))
    )
      await tx.agentProfile.create({
        data: {
          userId: id,
          identifier: await nextAgentIdentifier(
            tx,
            new Date().getUTCFullYear(),
          ),
        },
      });
  }
}
function mapWriteError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      throw conflict(
        "Un compte utilise déjà ce téléphone ou cet email.",
        "ACCOUNT_EXISTS",
      );
    if (error.code === "P2034")
      throw conflict(
        "Un autre responsable a modifié cette équipe. Rechargez la page puis réessayez.",
        "STALE_UPDATE",
      );
  }
  throw error;
}
export async function createManagedUser(actorId: string, input: unknown) {
  const data = createManagedUserSchema.parse(input);
  const passwordHash = await hash(data.password, 12);
  try {
    return await getDb().$transaction(
      async (tx) => {
        await lockIdentity(tx);
        const actor = await freshActor(tx, actorId);
        const companyId = data.companyId ?? actor.companyId;
        if (actor.role.code !== "SUPER_ADMIN" && companyId !== actor.companyId)
          throw new AppError(
            403,
            "COMPANY_FORBIDDEN",
            "Vous ne pouvez pas créer de compte dans cette société.",
          );
        if (roleLevels[data.role] >= roleLevels[actor.role.code])
          throw new AppError(
            403,
            "ROLE_FORBIDDEN",
            "Le rôle attribué doit être strictement inférieur au vôtre.",
          );
        if (
          !(await tx.company.findUnique({
            where: { id: companyId },
            select: { id: true },
          }))
        )
          throw new AppError(
            404,
            "NOT_FOUND",
            "Cette société est introuvable.",
          );
        await assertParent(
          tx,
          actor,
          { companyId, role: data.role },
          data.parentId,
        );
        const role = await tx.role.findUniqueOrThrow({
          where: { code: data.role },
          select: { id: true },
        });
        const user = await tx.user.create({
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            email: data.email,
            passwordHash,
            companyId,
            roleId: role.id,
            ...(data.parentId
              ? { parentLink: { create: { parentId: data.parentId } } }
              : {}),
          },
        });
        await ensureProfile(tx, user.id, data.role);
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            companyId,
            action: "USER_CREATED",
            targetType: "User",
            targetId: user.id,
            metadata: {
              role: data.role,
              parentId: data.parentId,
              source: "TEAM_MANAGEMENT",
            },
          },
        });
        return dto(
          await tx.user.findUniqueOrThrow({
            where: { id: user.id },
            select: detailSelect,
          }),
        );
      },
      { timeout: 15000 },
    );
  } catch (error) {
    mapWriteError(error);
  }
}
export async function updateManagedUser(
  actorId: string,
  id: string,
  input: unknown,
) {
  const data = updateManagedUserSchema.parse(input);
  try {
    return await getDb().$transaction(
      async (tx) => {
        await lockIdentity(tx);
        const actor = await freshActor(tx, actorId);
        const current = await targetFor(tx, actor, id);
        if (
          current.updatedAt.getTime() !==
          new Date(data.expectedUpdatedAt).getTime()
        )
          throw conflict(
            "Ce compte a changé depuis l’ouverture du formulaire. Rechargez-le avant d’enregistrer.",
            "STALE_UPDATE",
          );
        const role = data.role ?? current.role.code,
          status = data.status ?? current.status;
        const parentId =
          data.parentId === undefined
            ? (current.parentLink?.parent.id ?? null)
            : data.parentId;
        const roleChanged = role !== current.role.code,
          statusChanged = status !== current.status,
          parentChanged = parentId !== (current.parentLink?.parent.id ?? null);
        if (
          !canAssignRole(
            principalFor(actor),
            {
              id: current.id,
              companyId: current.companyId,
              countryId: current.company.countryId,
              role: current.role.code,
            },
            role,
            new Set([current.id]),
          )
        )
          throw new AppError(
            403,
            "ROLE_FORBIDDEN",
            "Ce rôle ne peut pas être attribué par votre compte.",
          );
        if (roleChanged && role === "DEFAULT_COMMERCIAL")
          throw conflict(
            "Le commercial par défaut se configure séparément ; attribuez le rôle Commercial.",
            "DEFAULT_COMMERCIAL_PROTECTED",
          );
        if (
          current.defaultForCompany &&
          (status !== "ACTIVE" || role !== "DEFAULT_COMMERCIAL")
        )
          throw conflict(
            "Ce compte assure le rattachement des nouveaux clients. Configurez un remplaçant avant de changer son rôle ou son statut.",
            "DEFAULT_COMMERCIAL_PROTECTED",
          );
        if (roleChanged || parentChanged) {
          await assertParent(
            tx,
            actor,
            { id, companyId: current.companyId, role },
            parentId,
          );
          const children = await tx.user.findMany({
            where: { parentLink: { parentId: id } },
            select: { companyId: true, role: { select: { code: true } } },
          });
          if (
            children.some(
              (child) =>
                child.companyId !== current.companyId ||
                roleLevels[child.role.code] >= roleLevels[role],
            )
          )
            throw conflict(
              "Le rôle choisi doit rester supérieur à celui de chaque utilisateur directement rattaché.",
            );
          if (
            parentChanged &&
            children.length &&
            roleLevels[actor.role.code] < roleLevels.ADMIN
          )
            throw new AppError(
              403,
              "SUBTREE_TRANSFER_FORBIDDEN",
              "Le déplacement d’une équipe complète est réservé aux administrateurs.",
            );
        }
        const profileFields = (
          ["firstName", "lastName", "phone", "email"] as const
        ).filter(
          (key) => data[key] !== undefined && data[key] !== current[key],
        );
        const credentialsChanged = profileFields.some(
          (key) => key === "phone" || key === "email",
        );
        const sensitive =
          roleChanged || statusChanged || parentChanged || credentialsChanged;
        if (!profileFields.length && !sensitive) return dto(current);
        const roleRecord = roleChanged
          ? await tx.role.findUniqueOrThrow({
              where: { code: role },
              select: { id: true },
            })
          : null;
        await tx.user.update({
          where: { id },
          data: {
            ...Object.fromEntries(profileFields.map((key) => [key, data[key]])),
            ...(roleRecord ? { roleId: roleRecord.id } : {}),
            status,
            ...(data.phone !== undefined && data.phone !== current.phone
              ? { phoneVerifiedAt: null }
              : {}),
            updatedAt: new Date(
              Math.max(Date.now(), current.updatedAt.getTime() + 1),
            ),
          },
        });
        if (parentChanged) {
          if (parentId)
            await tx.userHierarchy.upsert({
              where: { childId: id },
              create: { childId: id, parentId },
              update: { parentId },
            });
          else await tx.userHierarchy.deleteMany({ where: { childId: id } });
        }
        await ensureProfile(tx, id, role);
        const affectedIds = parentChanged ? await branchIds(tx, id) : [id];
        const revoked = sensitive
          ? await tx.authSession.deleteMany({
              where: { userId: { in: affectedIds } },
            })
          : { count: 0 };
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            companyId: current.companyId,
            action: "USER_UPDATED",
            targetType: "User",
            targetId: id,
            metadata: {
              profileFields,
              ...(roleChanged
                ? { role: { from: current.role.code, to: role } }
                : {}),
              ...(statusChanged
                ? { status: { from: current.status, to: status } }
                : {}),
              ...(parentChanged
                ? {
                    parent: {
                      from: current.parentLink?.parent.id ?? null,
                      to: parentId,
                    },
                    subtreeSize: affectedIds.length,
                  }
                : {}),
              revokedSessions: revoked.count,
            },
          },
        });
        return dto(
          await tx.user.findUniqueOrThrow({
            where: { id },
            select: detailSelect,
          }),
        );
      },
      { timeout: 15000 },
    );
  } catch (error) {
    mapWriteError(error);
  }
}
export async function managedUserDetail(actor: AuthenticatedUser, id: string) {
  return getDb().$transaction(async (tx) =>
    dto(await targetFor(tx, actor, id)),
  );
}
export async function managementCompanies(actor: AuthenticatedUser) {
  return getDb().company.findMany({
    where: actor.role.code === "SUPER_ADMIN" ? {} : { id: actor.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
export async function parentOptions(actor: AuthenticatedUser, input: unknown) {
  const data = parentQuerySchema.parse(input),
    companyId = data.companyId ?? actor.companyId;
  if (actor.role.code !== "SUPER_ADMIN" && companyId !== actor.companyId)
    throw new AppError(
      403,
      "COMPANY_FORBIDDEN",
      "Cette société n’appartient pas à votre périmètre.",
    );
  const target = data.targetId
    ? await managedUserDetail(actor, data.targetId)
    : null;
  if (target && target.companyId !== companyId) throw notFound();
  const excluded = target ? await branchIds(getDb(), target.id) : [];
  const scope = await managedUserWhere(actor);
  const roles = (Object.keys(roleLevels) as RoleCode[]).filter(
    (role) => roleLevels[role] > roleLevels[data.role],
  );
  const items = await getDb().user.findMany({
    where: {
      AND: [
        { OR: [scope, { id: actor.id }] },
        {
          companyId,
          status: "ACTIVE",
          id: { notIn: excluded },
          role: { code: { in: roles } },
        },
        ...(data.q
          ? [
              {
                OR: [
                  {
                    firstName: {
                      contains: data.q,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    lastName: {
                      contains: data.q,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            ]
          : []),
      ],
    },
    select: parentSelect,
    orderBy: [{ firstName: "asc" }, { id: "asc" }],
    take: 31,
  });
  return {
    items: items.slice(0, 30).map((u) => ({ ...u, role: u.role.code })),
    hasMore: items.length > 30,
  };
}
export async function managedUserHistory(
  actor: AuthenticatedUser,
  id: string,
  page = 1,
) {
  await managedUserDetail(actor, id);
  const where = {
    targetType: "User",
    targetId: id,
    action: { in: ["USER_CREATED", "USER_UPDATED"] },
  };
  const [items, total] = await Promise.all([
    getDb().auditLog.findMany({
      where,
      select: {
        id: true,
        createdAt: true,
        action: true,
        metadata: true,
        actor: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 20,
      skip: (page - 1) * 20,
    }),
    getDb().auditLog.count({ where }),
  ]);
  // DTO whitelist: no arbitrary metadata, credentials, phone or email values.
  return {
    items: items.map((item) => {
      const meta =
        item.metadata &&
        typeof item.metadata === "object" &&
        !Array.isArray(item.metadata)
          ? item.metadata
          : {};
      const roleChange =
        meta.role && typeof meta.role === "object" && !Array.isArray(meta.role)
          ? meta.role
          : null;
      const statusChange =
        meta.status &&
        typeof meta.status === "object" &&
        !Array.isArray(meta.status)
          ? meta.status
          : null;
      const isRole = (v: unknown): v is RoleCode =>
        typeof v === "string" && Object.hasOwn(roleLevels, v);
      const isStatus = (v: unknown): v is "ACTIVE" | "SUSPENDED" | "CLOSED" =>
        typeof v === "string" && ["ACTIVE", "SUSPENDED", "CLOSED"].includes(v);
      return {
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        action: item.action,
        actorName: item.actor
          ? `${item.actor.firstName} ${item.actor.lastName}`
          : "Compte indisponible",
        profileFields: Array.isArray(meta.profileFields)
          ? meta.profileFields.filter(
              (v): v is string =>
                typeof v === "string" &&
                ["firstName", "lastName", "phone", "email"].includes(v),
            )
          : [],
        createdRole: isRole(meta.role) ? meta.role : null,
        roleChange:
          roleChange && isRole(roleChange.from) && isRole(roleChange.to)
            ? { from: roleChange.from, to: roleChange.to }
            : null,
        statusChange:
          statusChange &&
          isStatus(statusChange.from) &&
          isStatus(statusChange.to)
            ? { from: statusChange.from, to: statusChange.to }
            : null,
        parentChanged: !!meta.parent,
        revokedSessions:
          typeof meta.revokedSessions === "number" ? meta.revokedSessions : 0,
      };
    }),
    total,
    page,
    pageSize: 20,
  };
}

export async function resetManagedPassword(
  actorId: string,
  id: string,
  input: unknown,
) {
  const data = managedPasswordSchema.parse(input),
    passwordHash = await hash(data.password, 12);
  await getDb().$transaction(async (tx) => {
    await lockIdentity(tx);
    const actor = await freshActor(tx, actorId),
      target = await targetFor(tx, actor, id);
    if (
      target.updatedAt.getTime() !== new Date(data.expectedUpdatedAt).getTime()
    )
      throw conflict("Le compte a changé. Rechargez sa fiche.", "STALE_UPDATE");
    await tx.user.update({ where: { id }, data: { passwordHash } });
    await tx.authSession.deleteMany({ where: { userId: id } });
    await tx.passwordReset.updateMany({
      where: { userId: id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        companyId: target.companyId,
        action: "PASSWORD_RESET",
        targetType: "User",
        targetId: id,
        metadata: { sessionsRevoked: true },
      },
    });
  });
}
