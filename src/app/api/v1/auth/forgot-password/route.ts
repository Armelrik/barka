import { after } from "next/server";
import { assertSameOrigin, readJsonBody } from "@/lib/server/http-security";
import { consumeRateLimit, clientRateKey } from "@/lib/server/rate-limit";
import { apiError, privateJson } from "@/lib/server/errors";
import { requestPasswordReset } from "@/modules/identity/recovery";
import { recoveryRequestSchema } from "@/modules/identity/recovery-validation";
import { deliverMailBatch } from "@/modules/messaging/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const started = Date.now();
  try {
    assertSameOrigin(request);
    await consumeRateLimit(`recovery:ip:${clientRateKey(request)}`, 10, 900);
    const data = recoveryRequestSchema.parse(await readJsonBody(request));
    await consumeRateLimit(`recovery:email:${data.email}`, 5, 3600);
    const resetId = await requestPasswordReset(data);
    after(async () => {
      await deliverMailBatch(2, resetId);
    });
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, 500 - (Date.now() - started))),
    );
    return privateJson({
      message:
        "Si un compte actif est associé à cette adresse, un lien de récupération vous sera envoyé. Vérifiez aussi vos courriers indésirables.",
    });
  } catch (e) {
    return apiError(e);
  }
}
