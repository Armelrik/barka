import type { Prisma } from "@/generated/prisma/client";
// Use inside the SAME transaction as AgentProfile creation. No standalone allocation.
export async function nextAgentIdentifier(
  tx: Prisma.TransactionClient,
  year: number,
) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999)
    throw new Error("Année invalide");
  const sequence = await tx.annualSequence.upsert({
    where: { year },
    create: { year, value: 1 },
    update: { value: { increment: 1 } },
  });
  if (sequence.value > 99999) throw new Error("Séquence annuelle épuisée");
  return `BARKA-D${year}${String(sequence.value).padStart(5, "0")}`;
}
