ALTER TABLE "VisitRequest" ADD COLUMN "message" TEXT, ADD COLUMN "reply" TEXT;
CREATE INDEX "VisitRequest_status_desiredAt_idx" ON "VisitRequest"("status", "desiredAt");
-- An account may have only one active request per listing. Closed requests remain in history.
CREATE UNIQUE INDEX "VisitRequest_active_user_listing_key" ON "VisitRequest"("userId", "listingId") WHERE "status" IN ('REQUESTED', 'CONFIRMED');
