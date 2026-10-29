"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowUpRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { loginSchema, registrationSchema } from "@/modules/identity/validation";
import { Button } from "@/components/ui/button";

async function submitAuth(endpoint: string, data: unknown) {
  const response = await fetch(`/api/v1/auth/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "same-origin",
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(
      typeof result?.error?.message === "string"
        ? result.error.message
        : "La demande n’a pas abouti. Réessayez.",
    );
  }
}
function PasswordInput({
  registration,
  visible,
  toggle,
  input,
  error,
}: {
  registration?: boolean;
  visible: boolean;
  toggle: () => void;
  input: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <div className="auth-field">
      <label htmlFor="password">Mot de passe</label>
      <div className="password-input">
        <input
          id="password"
          type={visible ? "text" : "password"}
          autoComplete={registration ? "new-password" : "current-password"}
          maxLength={72}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? "password-error"
              : registration
                ? "password-help"
                : undefined
          }
          {...input}
        />
        <button
          type="button"
          aria-label={
            visible ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
          aria-pressed={visible}
          onClick={toggle}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? (
        <p id="password-error" className="field-error">
          {error}
        </p>
      ) : (
        registration && (
          <p id="password-help" className="field-hint">
            Au moins 12 caractères. Une phrase est facile à retenir.
          </p>
        )
      )}
    </div>
  );
}
export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof loginSchema>,
    unknown,
    z.output<typeof loginSchema>
  >({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (data) => {
    setMessage("");
    try {
      await submitAuth("login", data);
      router.replace("/espace");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "La connexion a échoué.",
      );
    }
  });
  return (
    <form
      method="post"
      action="/api/v1/auth/login"
      onSubmit={submit}
      className="auth-form"
      noValidate
    >
      <div className="auth-field">
        <label htmlFor="identifier">Téléphone ou email</label>
        <input
          id="identifier"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="+226 70 12 34 56"
          maxLength={254}
          aria-invalid={!!errors.identifier}
          aria-describedby={errors.identifier ? "identifier-error" : undefined}
          {...register("identifier")}
        />
        {errors.identifier && (
          <p id="identifier-error" className="field-error">
            {errors.identifier.message}
          </p>
        )}
      </div>
      <PasswordInput
        visible={visible}
        toggle={() => setVisible(!visible)}
        input={register("password")}
        error={errors.password?.message}
      />
      {message && (
        <p className="auth-message" role="alert">
          {message}
        </p>
      )}
      <Button type="submit" disabled={isSubmitting} className="auth-submit">
        {isSubmitting ? (
          <>
            <LoaderCircle size={17} className="spin" />
            Connexion en cours…
          </>
        ) : (
          <>
            Me connecter <ArrowUpRight size={17} />
          </>
        )}
      </Button>
      <p className="auth-switch">
        Vous découvrez BARKA ?{" "}
        <Link href="/inscription">Créer un compte gratuit</Link>
      </p>
    </form>
  );
}
export function RegistrationForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<
    z.input<typeof registrationSchema>,
    unknown,
    z.output<typeof registrationSchema>
  >({
    resolver: zodResolver(registrationSchema),
    defaultValues: { email: "", consent: false },
  });
  const submit = handleSubmit(async (data) => {
    setMessage("");
    try {
      await submitAuth("register", data);
      router.replace("/espace");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "La création du compte a échoué.",
      );
    }
  });
  return (
    <form
      method="post"
      action="/api/v1/auth/register"
      onSubmit={submit}
      className="auth-form"
      noValidate
    >
      <div className="auth-fields-grid">
        {(
          [
            {
              key: "firstName",
              label: "Prénom",
              autocomplete: "given-name",
              placeholder: "Votre prénom",
              type: "text",
              max: 80,
            },
            {
              key: "lastName",
              label: "Nom",
              autocomplete: "family-name",
              placeholder: "Votre nom",
              type: "text",
              max: 80,
            },
            {
              key: "phone",
              label: "Téléphone",
              autocomplete: "tel",
              placeholder: "+226 70 12 34 56",
              type: "tel",
              max: 40,
            },
            {
              key: "email",
              label: "Email (facultatif)",
              autocomplete: "email",
              placeholder: "vous@exemple.bf",
              type: "email",
              max: 254,
            },
          ] as const
        ).map((field) => (
          <div className="auth-field" key={field.key}>
            <label htmlFor={field.key}>{field.label}</label>
            <input
              id={field.key}
              type={field.type}
              autoComplete={field.autocomplete}
              placeholder={field.placeholder}
              maxLength={field.max}
              aria-invalid={!!errors[field.key]}
              aria-describedby={
                errors[field.key] ? `${field.key}-error` : undefined
              }
              {...register(field.key)}
            />
            {errors[field.key] && (
              <p id={`${field.key}-error`} className="field-error">
                {errors[field.key]?.message}
              </p>
            )}
          </div>
        ))}
      </div>
      <PasswordInput
        registration
        visible={visible}
        toggle={() => setVisible(!visible)}
        input={register("password")}
        error={errors.password?.message}
      />
      <div>
        <label className="consent-label">
          <input
            type="checkbox"
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            {...register("consent")}
          />
          <span>
            J’accepte les{" "}
            <Link href="/conditions" target="_blank" rel="noopener">
              conditions d’utilisation
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" target="_blank" rel="noopener">
              politique de confidentialité
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" className="field-error">
            {errors.consent.message}
          </p>
        )}
      </div>
      {message && (
        <p role="alert" className="auth-message">
          {message}
        </p>
      )}
      <Button type="submit" className="auth-submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <LoaderCircle size={17} className="spin" />
            Création en cours…
          </>
        ) : (
          <>
            Créer mon compte gratuit <ArrowUpRight size={17} />
          </>
        )}
      </Button>
      <p className="auth-switch">
        Déjà un compte ? <Link href="/connexion">Me connecter</Link>
      </p>
    </form>
  );
}
