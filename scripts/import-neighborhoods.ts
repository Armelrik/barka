import "dotenv/config";
import { createHash } from "node:crypto";
import { getDb } from "../src/lib/server/db";
import { lockIdentity } from "../src/lib/server/identity-lock";
import { ouagaNeighborhoods } from "../src/modules/catalog/locations";
import { normalizeLocation } from "../src/modules/catalog/query";
const cityCode = process.argv
  .find((arg) => arg.startsWith("--city-code="))
  ?.slice(12);
const apply = process.argv.includes("--apply"),
  db = getDb();
try {
  const result = await db.$transaction(
    async (tx) => {
      if (apply) await lockIdentity(tx);
      const cities = await tx.location.findMany({
        where: {
          ...(cityCode ? { code: cityCode } : {}),
          kind: "CITY",
          name: { equals: "Ouagadougou", mode: "insensitive" },
          country: { code: "BF" },
        },
        select: { id: true, countryId: true },
      });
      if (cities.length !== 1)
        throw new Error(
          "Une ville Ouagadougou unique est requise dans le référentiel BF.",
        );
      const city = cities[0],
        existing = await tx.location.findMany({
          where: { parentId: city.id, kind: "DISTRICT" },
          select: { name: true },
        });
      let created = 0,
        retained = 0;
      for (const item of ouagaNeighborhoods) {
        const names = [item.name, ...(item.aliases ?? [])].map(
          normalizeLocation,
        );
        if (
          existing.some((row) => names.includes(normalizeLocation(row.name)))
        ) {
          retained++;
          continue;
        }
        const code = `BARKA-OUAGA-Q-${createHash("sha256").update(normalizeLocation(item.name)).digest("hex").slice(0, 16)}`;
        if (apply)
          await tx.location.upsert({
            where: { code },
            update: {},
            create: {
              code,
              name: item.name,
              kind: "DISTRICT",
              countryId: city.countryId,
              parentId: city.id,
            },
          });
        created++;
      }
      return {
        mode: apply ? "appliqué" : "simulation",
        sourceNames: ouagaNeighborhoods.length,
        toCreate: created,
        existingRetained: retained,
      };
    },
    { timeout: 30000 },
  );
  console.log(JSON.stringify(result));
} catch {
  console.error(
    "Import des quartiers interrompu. Aucune coordonnée ni secret affiché.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
