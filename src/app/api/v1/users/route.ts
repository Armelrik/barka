import { z } from "zod";
import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { listManagedUsers } from "@/modules/identity/access";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requireUser("users.manage");
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .parse(new URL(request.url).searchParams.get("page") ?? 1);
    return privateJson(await listManagedUsers(user, page));
  } catch (error) {
    return apiError(error);
  }
}
