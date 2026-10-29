import "server-only";
import { redirect, notFound } from "next/navigation";
import { requireUser } from "./session";
import { AppError } from "./errors";
export async function requirePageUser(permission?: string) {
  try {
    return await requireUser(permission);
  } catch (error) {
    if (error instanceof AppError && error.status === 401)
      redirect("/connexion");
    if (error instanceof AppError && error.status === 403) notFound();
    throw error;
  }
}
