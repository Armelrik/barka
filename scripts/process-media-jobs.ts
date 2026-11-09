import "dotenv/config";
import { z } from "zod";
import { getDb } from "../src/lib/server/db";
import { removeMedia } from "../src/modules/media/storage";
const db = getDb();
async function main() {
  await db.outboxJob.updateMany({
    where: {
      kind: "MEDIA_DELETE",
      status: "PROCESSING",
      updatedAt: { lt: new Date(Date.now() - 15 * 60000) },
    },
    data: { status: "PENDING", lockedAt: null },
  });
  let completed = 0;
  for (let i = 0; i < 20; i++) {
    const job = await db.outboxJob.findFirst({
      where: {
        kind: "MEDIA_DELETE",
        status: "PENDING",
        nextRunAt: { lte: new Date() },
      },
      orderBy: { createdAt: "asc" },
    });
    if (!job) break;
    const claimed = await db.outboxJob.updateMany({
      where: { id: job.id, status: "PENDING" },
      data: {
        status: "PROCESSING",
        lockedAt: new Date(),
        attempts: { increment: 1 },
      },
    });
    if (!claimed.count) continue;
    try {
      const { assetId } = z
        .object({ assetId: z.string().min(1).max(80) })
        .parse(job.payload);
      const asset = await db.mediaAsset.findUnique({
        where: { id: assetId },
        include: {
          _count: {
            select: {
              propertyMedia: true,
              documents: true,
              scenes: true,
              floorPlans: true,
              modelTours: true,
            },
          },
          identityProfile: { select: { id: true } },
        },
      });
      if (asset) {
        if (
          asset.status !== "DELETED" ||
          Object.values(asset._count).some((n) => n > 0) ||
          asset.identityProfile
        )
          throw new Error("Le média est encore référencé.");
        await removeMedia(asset.objectKey);
      }
      await db.outboxJob.update({
        where: { id: job.id },
        data: { status: "SENT", lockedAt: null },
      });
      completed++;
    } catch {
      await db.outboxJob.update({
        where: { id: job.id },
        data: {
          status: job.attempts >= 4 ? "FAILED" : "PENDING",
          lockedAt: null,
          nextRunAt: new Date(
            Date.now() + Math.min(3600, 60 * 2 ** job.attempts) * 1000,
          ),
        },
      });
      console.error(
        "BARKA : suppression de média différée, consulter la file des tâches.",
      );
    }
  }
  console.info(`${completed} tâche(s) de suppression de média terminée(s).`);
}
main()
  .catch(() => {
    console.error(
      "Échec du traitement des médias. Vérifier la configuration et la base.",
    );
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
