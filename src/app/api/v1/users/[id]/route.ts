import {
  updateManagedUser,
  managedUserDetail,
} from "@/modules/identity/management";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";
import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUser("users.manage");
    const { id } = await params;
    z.string().min(1).max(80).parse(id);
    return privateJson({ user: await managedUserDetail(actor, id) });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("users.manage");
    const { id } = await params;
    z.string().min(1).max(80).parse(id);
    await consumeRateLimit(`users:write:${actor.id}`, 60, 900);
    return privateJson({
      user: await updateManagedUser(actor.id, id, await readJsonBody(request)),
    });
  } catch (error) {
    return apiError(error);
  }
}
