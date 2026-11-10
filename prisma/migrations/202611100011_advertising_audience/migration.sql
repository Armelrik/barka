CREATE TABLE "AdCreative" (
 "id" TEXT NOT NULL PRIMARY KEY, "ownerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 "objectKey" TEXT NOT NULL UNIQUE, "sizeBytes" INTEGER NOT NULL, "width" INTEGER NOT NULL, "height" INTEGER NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "Advertisement" ADD COLUMN "ownerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 ADD COLUMN "description" TEXT NOT NULL DEFAULT '', ADD COLUMN "sponsorName" TEXT NOT NULL DEFAULT 'BARKA',
 ADD COLUMN "campaignKind" TEXT NOT NULL DEFAULT 'HOUSE', ADD COLUMN "imagePath" TEXT NOT NULL DEFAULT '/afriloc/ad-banner.jpg',
 ADD COLUMN "creativeId" TEXT REFERENCES "AdCreative"("id") ON DELETE SET NULL ON UPDATE CASCADE,
 ADD COLUMN "cta" TEXT NOT NULL DEFAULT 'Découvrir', ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "AudienceEvent" (
 "id" TEXT NOT NULL PRIMARY KEY, "dedupeKey" CHAR(64) NOT NULL UNIQUE, "sessionHash" CHAR(64) NOT NULL,
 "viewId" TEXT NOT NULL, "kind" TEXT NOT NULL, "path" TEXT NOT NULL, "device" TEXT NOT NULL,
 "campaignId" TEXT REFERENCES "Advertisement"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 "placement" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "AudienceEvent_createdAt_kind_idx" ON "AudienceEvent"("createdAt", "kind");
CREATE INDEX "AudienceEvent_campaignId_kind_createdAt_idx" ON "AudienceEvent"("campaignId", "kind", "createdAt");
