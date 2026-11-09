ALTER TABLE "Listing" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
-- A demo cannot bypass the real-listing checks through an ordinary create/update request.
-- The dedicated fixture importer is the only writer of isDemo; public queries also require BARKA-DEMO and fictitious=true.
