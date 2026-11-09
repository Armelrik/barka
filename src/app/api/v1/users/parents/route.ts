import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { parentOptions } from "@/modules/identity/management";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return privateJson(
      await parentOptions(
        await requireUser("users.manage"),
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
  } catch (error) {
    return apiError(error);
  }
}
