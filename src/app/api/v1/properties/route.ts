import { requireUser } from "@/lib/server/session";
import { readJsonBody } from "@/lib/server/http-security";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizePropertyWrite } from "@/modules/listings/http";
import {
  createProperty,
  listPrivateListings,
} from "@/modules/listings/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    return privateJson(
      await listPrivateListings(
        await requireUser("properties.manage"),
        Object.fromEntries(new URL(request.url).searchParams),
      ),
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    const actor = await authorizePropertyWrite(request);
    return privateJson(
      {
        listing: await createProperty(
          actor.id,
          await readJsonBody(request, 16384),
        ),
      },
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
