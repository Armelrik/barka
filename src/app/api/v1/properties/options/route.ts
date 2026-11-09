import { z } from "zod";
import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
import { propertyOptions } from "@/modules/listings/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const actor = await requireUser("properties.manage"),
      q = z
        .object({
          companyId: z.string().min(1).max(80).optional(),
          q: z.string().trim().max(100).default(""),
        })
        .parse(Object.fromEntries(new URL(request.url).searchParams));
    return privateJson(await propertyOptions(actor, q.companyId, q.q));
  } catch (e) {
    return apiError(e);
  }
}
