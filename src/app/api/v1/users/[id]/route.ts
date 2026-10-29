import { z } from "zod";
import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { managedUserById } from "@/modules/identity/access";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUser("users.manage");
    const { id } = await params;
    z.string().min(1).max(80).parse(id);
    return privateJson({ user: await managedUserById(actor, id) });
  } catch (error) {
    return apiError(error);
  }
}
