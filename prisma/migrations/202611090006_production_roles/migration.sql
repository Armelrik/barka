-- Reference data required on a fresh production database, without demo accounts.
INSERT INTO "Role" (id,code,level) VALUES
('role-super-admin','SUPER_ADMIN',6),('role-admin','ADMIN',5),
('role-supervisor','SUPERVISOR',4),('role-manager','MANAGER',3),
('role-commercial','COMMERCIAL',2),('role-default-commercial','DEFAULT_COMMERCIAL',2),
('role-client','CLIENT',1),('role-visitor','VISITOR',0)
ON CONFLICT (code) DO NOTHING;
INSERT INTO "Permission" (id,code) VALUES
('permission-users-manage','users.manage'),('permission-identity-review','identity.review'),
('permission-properties-manage','properties.manage'),('permission-listings-moderate','listings.moderate'),
('permission-finance-read','finance.read'),('permission-settings-manage','settings.manage')
ON CONFLICT (code) DO NOTHING;
INSERT INTO "RolePermission" ("roleId","permissionId")
SELECT r.id,p.id FROM "Role" r CROSS JOIN "Permission" p
WHERE (r.code IN ('SUPER_ADMIN','ADMIN'))
OR (r.code='SUPERVISOR' AND p.code IN ('users.manage','properties.manage','listings.moderate','finance.read'))
OR (r.code IN ('MANAGER','COMMERCIAL','DEFAULT_COMMERCIAL') AND p.code IN ('users.manage','properties.manage','finance.read'))
ON CONFLICT DO NOTHING;
