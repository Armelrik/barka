import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { destroySession } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await readJsonBody(request);
    await destroySession();
    return privateJson({ next: "/connexion" });
  } catch (error) {
    return apiError(error);
  }
}
