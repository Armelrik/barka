ALTER TYPE "Channel" ADD VALUE 'IN_APP';
ALTER TABLE "User" ADD COLUMN "emailNotifications" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "availabilityEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Notification" ADD COLUMN "title" TEXT NOT NULL DEFAULT '', ADD COLUMN "body" TEXT NOT NULL DEFAULT '', ADD COLUMN "href" TEXT NOT NULL DEFAULT '/espace/visites', ADD COLUMN "readAt" TIMESTAMP(3), ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE TABLE "PasswordReset" (
 "id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "tokenHash" CHAR(64) NOT NULL UNIQUE, "email" TEXT NOT NULL, "passwordVersion" CHAR(64) NOT NULL,
 "expiresAt" TIMESTAMP(3) NOT NULL, "consumedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PasswordReset_userId_expiresAt_idx" ON "PasswordReset"("userId", "expiresAt");
CREATE TABLE "AvailabilitySlot" (
 "id" TEXT NOT NULL PRIMARY KEY, "agentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "startsAt" TIMESTAMP(3) NOT NULL, "endsAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "AvailabilitySlot_duration" CHECK ("endsAt" > "startsAt" AND "endsAt" <= "startsAt" + INTERVAL '12 hours')
);
CREATE INDEX "AvailabilitySlot_agentId_startsAt_endsAt_idx" ON "AvailabilitySlot"("agentId", "startsAt", "endsAt");
CREATE TABLE "MailDelivery" (
 "id" TEXT NOT NULL PRIMARY KEY, "key" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "payload" TEXT NOT NULL, "status" "JobStatus" NOT NULL DEFAULT 'PENDING', "attempts" INTEGER NOT NULL DEFAULT 0,
 "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "lockedAt" TIMESTAMP(3), "providerId" TEXT, "expiresAt" TIMESTAMP(3) NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "MailDelivery_status_nextRunAt_idx" ON "MailDelivery"("status", "nextRunAt");
