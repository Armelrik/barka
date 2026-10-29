import { z } from "zod";
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}
export function privateJson(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}
export function apiError(error: unknown) {
  if (error instanceof z.ZodError)
    return privateJson(
      {
        error: {
          code: "VALIDATION",
          message: "Veuillez vérifier les informations saisies.",
          fields: z.flattenError(error).fieldErrors,
        },
      },
      400,
    );
  if (error instanceof AppError) {
    const response = privateJson(
      { error: { code: error.code, message: error.message } },
      error.status,
    );
    if (error.retryAfter)
      response.headers.set("Retry-After", String(error.retryAfter));
    return response;
  }
  // Do not expose database errors, connection strings, submitted passwords or private fields.
  console.error("BARKA: une opération serveur a échoué.");
  return privateJson(
    {
      error: {
        code: "UNAVAILABLE",
        message:
          "Le service est momentanément indisponible. Réessayez dans un instant.",
      },
    },
    503,
  );
}
