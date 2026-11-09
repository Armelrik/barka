import { teamQuerySchema } from "@/modules/identity/validation";
import { createManagedUser } from "@/modules/identity/management";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { listManagedUsers } from "@/modules/identity/access";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser("users.manage");
    const query = teamQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return privateJson(await listManagedUsers(user, query.page, query));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser("users.manage");
    await consumeRateLimit(`users:write:${actor.id}`, 60, 900);
    return privateJson(
      { user: await createManagedUser(actor.id, await readJsonBody(request)) },
      201,
    );
  } catch (error) {
    return apiError(error);
  }
}
