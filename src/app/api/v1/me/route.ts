import { requireUser } from "@/lib/server/session";
import { apiError, privateJson } from "@/lib/server/errors";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await requireUser();
    return privateJson({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        email: user.email,
        role: user.role.code,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
