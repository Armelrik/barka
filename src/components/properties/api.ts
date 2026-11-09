"use client";
import { useRef, useState } from "react";
export function usePropertyMutation() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run<T>(
    path: string,
    method: string,
    input?: unknown,
  ): Promise<T | null> {
    if (locked.current) return null;
    locked.current = true;
    setBusy(true);
    setError("");
    try {
      const form = input instanceof FormData;
      const response = await fetch(path, {
        method,
        ...(input === undefined
          ? {}
          : {
              headers: form
                ? undefined
                : { "Content-Type": "application/json" },
              body: form ? input : JSON.stringify(input),
            }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error?.message ?? "L’opération a échoué.");
      return body as T;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le service est indisponible.");
      return null;
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  return { busy, error, setError, run };
}
