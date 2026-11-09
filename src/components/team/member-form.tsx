"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle, Save, UserPlus } from "lucide-react";
import type { ManagedUserDetail } from "@/modules/identity/management";
import { roleLevels, type RoleCode } from "@/modules/identity/policy";
import {
  createManagedUserSchema,
  updateManagedUserSchema,
  roleLabels,
  statusLabels,
} from "@/modules/identity/validation";

type Parent = {
  id: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
};
type Fields = Record<string, string[]>;
function ParentPicker({
  role,
  companyId,
  targetId,
  value,
  onChange,
  current,
  allowRoot,
}: {
  allowRoot: boolean;
  role: RoleCode;
  companyId: string;
  targetId?: string;
  value: string;
  onChange: (id: string) => void;
  current?: Parent | null;
}) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<{ items: Parent[]; hasMore: boolean }>({
    items: [],
    hasMore: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        role,
        companyId,
        q: query,
        ...(targetId ? { targetId } : {}),
      });
      fetch(`/api/v1/users/parents?${params}`, {
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok)
            throw new Error(
              body.error?.message ?? "Impossible de charger les responsables.",
            );
          setData(body);
          setError("");
          setLoading(false);
        })
        .catch((reason) => {
          if (!controller.signal.aborted) {
            setError(
              reason instanceof Error
                ? reason.message
                : "Le chargement a échoué.",
            );
            setLoading(false);
          }
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [role, companyId, targetId, query, retry]);
  const options =
    current &&
    value === current.id &&
    !data.items.some((item) => item.id === current.id) &&
    roleLevels[current.role] > roleLevels[role]
      ? [current, ...data.items]
      : data.items;
  return (
    <div className="parent-picker">
      <label htmlFor="parent-search">Rechercher un responsable</label>
      <input
        id="parent-search"
        type="search"
        maxLength={100}
        value={query}
        placeholder="Prénom ou nom"
        onChange={(e) => {
          setLoading(true);
          setQuery(e.target.value);
        }}
      />
      <label htmlFor="parentId">Responsable de rattachement</label>
      <select
        id="parentId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-busy={loading}
      >
        <option value="">Choisir un responsable</option>
        {allowRoot && <option value="__root">Aucun rattachement</option>}
        {options.map((p) => (
          <option key={p.id} value={p.id}>
            {p.firstName} {p.lastName} — {roleLabels[p.role]}
          </option>
        ))}
      </select>
      {loading && <small role="status">Chargement des responsables…</small>}
      {error && (
        <div role="alert">
          {error}{" "}
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setLoading(true);
              setRetry(retry + 1);
            }}
          >
            Réessayer
          </button>
        </div>
      )}
      {!loading && !error && data.hasMore && (
        <small>
          Les 30 premiers résultats sont affichés. Précisez le nom pour trouver
          un autre responsable.
        </small>
      )}
      <small>
        Les responsables proposés sont actifs, dans votre périmètre et d’un
        niveau supérieur au rôle choisi.
      </small>
    </div>
  );
}
export function MemberForm({
  member,
  actorRole,
  companyId,
  companies,
}: {
  member?: ManagedUserDetail;
  actorRole: RoleCode;
  companyId: string;
  companies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    phone: member?.phone ?? "",
    email: member?.email ?? "",
    password: "",
    role: member?.role ?? "CLIENT",
    status: member?.status ?? "ACTIVE",
    parentId: member?.parent?.id ?? (member ? "__root" : ""),
    companyId: member?.companyId ?? companyId,
  });
  const [fields, setFields] = useState<Fields>({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [visible, setVisible] = useState(false);
  const roles = (Object.keys(roleLevels) as RoleCode[]).filter(
    (role) =>
      roleLevels[role] < roleLevels[actorRole] &&
      role !== "VISITOR" &&
      role !== "SUPER_ADMIN" &&
      (role !== "DEFAULT_COMMERCIAL" || role === member?.role),
  );
  function field(name: keyof typeof form, value: string) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "role" || name === "companyId" ? { parentId: "" } : {}),
    }));
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage("");
    setFields({});
    if (!form.parentId) {
      setFields({ parentId: ["Choisissez un responsable de rattachement."] });
      return;
    }
    const profile = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      role: form.role,
      parentId: form.parentId === "__root" ? null : form.parentId,
    };
    const parsed = member
      ? updateManagedUserSchema.safeParse({
          ...profile,
          status: form.status,
          expectedUpdatedAt: member.updatedAt,
        })
      : createManagedUserSchema.safeParse({
          ...profile,
          companyId: form.companyId,
          password: form.password,
        });
    if (!parsed.success) {
      const errors: Fields = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        (errors[key] ??= []).push(issue.message);
      }
      setFields(errors);
      setMessage("Vérifiez les champs indiqués.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(
        member ? `/api/v1/users/${member.id}` : "/api/v1/users",
        {
          method: member ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setFields(body.error?.fields ?? {});
        throw new Error(body.error?.message ?? "L’enregistrement a échoué.");
      }
      setForm((previous) => ({ ...previous, password: "" }));
      router.replace(`/espace/equipe/${body.user.id}?saved=1`);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Le service est indisponible.",
      );
    } finally {
      setBusy(false);
    }
  }
  const error = (name: string) =>
    fields[name]?.length ? (
      <p id={`${name}-error`} className="field-error">
        {fields[name].join(" ")}
      </p>
    ) : null;
  const input = (
    name: "firstName" | "lastName" | "phone" | "email",
    label: string,
    type = "text",
  ) => (
    <div className="auth-field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        value={form[name]}
        onChange={(e) => field(name, e.target.value)}
        autoComplete="off"
        maxLength={name === "email" ? 254 : name === "phone" ? 40 : 80}
        aria-invalid={!!fields[name]}
        aria-describedby={fields[name] ? `${name}-error` : undefined}
      />
      {error(name)}
    </div>
  );
  return (
    <form className="member-form auth-form" onSubmit={submit} noValidate>
      <fieldset disabled={busy}>
        <legend>Informations du compte</legend>
        <div className="auth-fields-grid">
          {input("firstName", "Prénom")}
          {input("lastName", "Nom")}
          {input("phone", "Téléphone", "tel")}
          {input("email", "Email (facultatif)", "email")}
        </div>
        {!member && (
          <div className="auth-field">
            <label htmlFor="initial-password">Mot de passe initial</label>
            <div className="password-input">
              <input
                id="initial-password"
                type={visible ? "text" : "password"}
                value={form.password}
                autoComplete="new-password"
                maxLength={72}
                onChange={(e) => field("password", e.target.value)}
                aria-invalid={!!fields.password}
              />
              <button
                type="button"
                aria-label={
                  visible
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error("password")}
            <small className="field-hint">
              Au moins 12 caractères, au plus 72 octets. Transmettez ce mot de
              passe au titulaire par un canal privé.
            </small>
          </div>
        )}
      </fieldset>
      <fieldset disabled={busy}>
        <legend>Rôle et rattachement</legend>
        <div className="auth-fields-grid">
          <div className="auth-field">
            <label htmlFor="companyId">Société</label>
            <select
              id="companyId"
              value={form.companyId}
              disabled={!!member || actorRole !== "SUPER_ADMIN"}
              onChange={(e) => field("companyId", e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {error("companyId")}
          </div>
          <div className="auth-field">
            <label htmlFor="role">Rôle</label>
            <select
              id="role"
              value={form.role}
              disabled={member?.isDefaultCommercial}
              onChange={(e) => field("role", e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
            {error("role")}
          </div>
        </div>
        <ParentPicker
          allowRoot={
            (actorRole === "SUPER_ADMIN" && form.role === "ADMIN") ||
            !!(member && !member.parent && member.role === form.role)
          }
          key={`${form.role}-${form.companyId}`}
          role={form.role}
          companyId={form.companyId}
          targetId={member?.id}
          value={form.parentId}
          onChange={(id) => field("parentId", id)}
          current={member?.parent}
        />
        {error("parentId")}
        {member && (
          <>
            <div className="auth-field">
              <label htmlFor="status">Statut du compte</label>
              <select
                id="status"
                value={form.status}
                disabled={member.isDefaultCommercial}
                onChange={(e) => field("status", e.target.value)}
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {error("status")}
            </div>
            <p className="account-note">
              La suspension et la fermeture déconnectent ce compte. La
              réactivation ne rétablit pas les anciennes sessions. Les
              changements de rôle, de rattachement ou d’identifiants imposent
              aussi une reconnexion.
            </p>
            {member.isDefaultCommercial && (
              <p className="team-info">
                Ce commercial assure le rattachement des nouveaux clients : son
                rôle et son statut sont protégés.
              </p>
            )}
            {member.childrenCount > 0 && (
              <p className="team-info">
                {member.childrenCount} utilisateur(s) directement rattaché(s).
                Le déplacement de cette équipe complète est réservé aux
                administrateurs.
              </p>
            )}
          </>
        )}
      </fieldset>
      {message && (
        <div role="alert" className="auth-message">
          {message}
          {member && (
            <button
              type="button"
              className="text-link"
              onClick={() => router.refresh()}
            >
              Recharger les informations
            </button>
          )}
        </div>
      )}
      <div className="member-form-actions">
        <Link href="/espace/equipe" className="team-secondary-button">
          Retour à l’équipe
        </Link>
        <button type="submit" disabled={busy} className="team-primary-button">
          {busy ? (
            <LoaderCircle size={18} className="spin" />
          ) : member ? (
            <Save size={18} />
          ) : (
            <UserPlus size={18} />
          )}{" "}
          {busy
            ? "Enregistrement…"
            : member
              ? "Enregistrer les modifications"
              : "Créer le compte"}
        </button>
      </div>
    </form>
  );
}
