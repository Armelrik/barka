// Pure policy only. Callers MUST load actor, grants and hierarchy from the database.
export const roleLevels = {
  SUPER_ADMIN: 6,
  ADMIN: 5,
  SUPERVISOR: 4,
  MANAGER: 3,
  COMMERCIAL: 2,
  DEFAULT_COMMERCIAL: 2,
  CLIENT: 1,
  VISITOR: 0,
} as const;
export type RoleCode = keyof typeof roleLevels;
export type Principal = {
  id: string;
  companyId: string;
  countryId: string;
  role: RoleCode;
  permissions: readonly string[];
  status: "ACTIVE" | "SUSPENDED" | "CLOSED";
};
export type ManagedUser = {
  id: string;
  companyId: string;
  countryId: string;
  role: RoleCode;
};
export function canManageUser(
  actor: Principal,
  target: ManagedUser,
  descendantIds: ReadonlySet<string>,
): boolean {
  if (
    actor.status !== "ACTIVE" ||
    !actor.permissions.includes("users.manage") ||
    actor.id === target.id
  )
    return false;
  if (roleLevels[actor.role] <= roleLevels[target.role]) return false;
  if (actor.role === "SUPER_ADMIN") return true;
  return (
    actor.companyId === target.companyId &&
    actor.countryId === target.countryId &&
    descendantIds.has(target.id)
  );
}
export function canAssignRole(
  actor: Principal,
  target: ManagedUser,
  requested: RoleCode,
  descendantIds: ReadonlySet<string>,
): boolean {
  return (
    canManageUser(actor, target, descendantIds) &&
    roleLevels[requested] < roleLevels[actor.role] &&
    requested !== "VISITOR"
  );
}
