ALTER TABLE "TourScene" ADD COLUMN "planX" DOUBLE PRECISION, ADD COLUMN "planY" DOUBLE PRECISION;
ALTER TABLE "TourScene" ADD CONSTRAINT "TourScene_plan_coordinates" CHECK (("planX" IS NULL AND "planY" IS NULL) OR ("planX" IS NOT NULL AND "planY" IS NOT NULL AND "planX" BETWEEN 0 AND 1 AND "planY" BETWEEN 0 AND 1));
INSERT INTO "Permission" ("id","code") VALUES ('permission-identity-review','identity.review') ON CONFLICT ("code") DO NOTHING;
INSERT INTO "RolePermission" ("roleId","permissionId") SELECT r.id,p.id FROM "Role" r CROSS JOIN "Permission" p WHERE r.code IN ('SUPER_ADMIN','ADMIN') AND p.code='identity.review' ON CONFLICT DO NOTHING;
