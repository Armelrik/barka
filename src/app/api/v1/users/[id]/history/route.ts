import { z } from "zod";
import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { managedUserHistory } from "@/modules/identity/management";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireUser("users.manage"),
      { id } = await params;
    z.string().min(1).max(80).parse(id);
    const page = z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .parse(new URL(request.url).searchParams.get("page") ?? 1);
    return privateJson(await managedUserHistory(actor, id, page));
  } catch (error) {
    return apiError(error);
  }
}
