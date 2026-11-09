export function hostedMediaRelay() {
  return (
    process.env.NEXT_PUBLIC_MEDIA_MAX_MB === "4" || process.env.VERCEL === "1"
  );
}
export function mediaLimitMb(kind: string) {
  return hostedMediaRelay() ? 4 : kind === "MODEL_3D" ? 32 : 16;
}
export function uploadSizeError(file: File, kind: string) {
  const limit = mediaLimitMb(kind);
  return file.size > limit * 1024 * 1024
    ? `Ce fichier dépasse ${limit} Mo. Réduisez sa taille avant l’envoi.`
    : "";
}
