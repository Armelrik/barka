import { authorizePropertyWrite } from "@/modules/listings/http";
import { resetManagedPassword } from "@/modules/identity/management";
import { consumeRateLimit } from "@/lib/server/rate-limit";
import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizePropertyWrite(request, "users.manage");
    await consumeRateLimit(`password:reset:${actor.id}`, 10, 900);
    await resetManagedPassword(
      actor.id,
      (await params).id,
      await readJsonBody(request),
    );
    return privateJson({ reset: true });
  } catch (e) {
    return apiError(e);
  }
}
