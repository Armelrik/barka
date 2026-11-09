import { z } from "zod";
import { apiError, privateJson } from "@/lib/server/errors";
import { authorizePropertyWrite } from "@/modules/listings/http";
import {
  uploadPropertyMedia,
  deletePropertyMedia,
} from "@/modules/media/service";
export const runtime = "nodejs";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizePropertyWrite(request);
    return privateJson(
      { asset: await uploadPropertyMedia(actor, (await params).id, request) },
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await authorizePropertyWrite(request),
      assetId = z
        .string()
        .min(1)
        .max(80)
        .parse(new URL(request.url).searchParams.get("assetId"));
    return privateJson(
      await deletePropertyMedia(actor.id, (await params).id, assetId),
    );
  } catch (e) {
    return apiError(e);
  }
}
