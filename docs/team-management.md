# Gestion des utilisateurs et équipes

La charte Afriloc est conservée dans l’annuaire et les formulaires. La gestion porte sur les comptes subordonnés, sans modifier l’inscription publique CLIENT ni permettre la création de SUPER_ADMIN.

## Parcours

- `/espace/equipe` : recherche par prénom/nom/téléphone/email, filtres rôle/statut, pagination serveur, responsable actuel et lien Gérer.
- `/espace/equipe/nouveau` : coordonnées, rôle inférieur au responsable connecté, mot de passe initial et rattachement. SUPER_ADMIN choisit la société ; les autres comptes restent dans leur société. Les comptes sont créés actifs.
- `/espace/equipe/:id` : profil, rôle, statut, responsable, identifiant démarcheur et historique paginé. La société ne peut pas être transférée. Les mots de passe existants ne sont ni affichés ni modifiés.

Les identifiants démarcheurs sont attribués dans la même transaction que la création du profil AgentProfile. Un changement vers CLIENT crée un ClientProfile si nécessaire. Les anciens profils sont conservés pour ne pas casser l’historique métier. Aucun profil professionnel n’est déclaré vérifié et aucun consentement du titulaire n’est inventé lors d’une création par un responsable.

## Autorisations et hiérarchie

Acteur actif avec permission `users.manage`, cible strictement inférieure, descendants uniquement et même société/pays. SUPER_ADMIN peut travailler dans les autres sociétés mais ne modifie ni lui-même ni un pair. Les champs soumis sont strictement validés ; ni permissions, ni société cible d’un PATCH, ni hash ne sont acceptés.

Le parent doit être actif, dans la même société, d’un niveau strictement supérieur au rôle résultant, et appartenir au périmètre de l’acteur (ou être l’acteur lui-même). Un ADMIN peut être créé sans parent uniquement par SUPER_ADMIN, notamment pour ouvrir la racine d’une autre société. Les autres rattachements exigent un parent. Les racines historiques ne sont pas modifiées implicitement lors d’une correction du profil.

La chaîne des ancêtres est vérifiée et les destinations appartenant au sous-arbre de la cible sont refusées. Une rétrogradation ne peut pas placer le compte au niveau de ses enfants ou en dessous. Le déplacement d’un sous-arbre non vide est réservé à ADMIN/SUPER_ADMIN ; les responsables inférieurs peuvent déplacer une feuille dans leur propre périmètre. Les parents sont recherchés par nom, avec 30 résultats maximum et invitation à préciser la recherche.

Le commercial référencé par `Company.defaultCommercialId` ne peut pas être suspendu, fermé ou changer de rôle via ces formulaires. Un workflow de remplacement explicite reste à développer. La création/attribution ordinaire du rôle DEFAULT_COMMERCIAL est donc refusée ; le rôle d’un compte existant est préservé.

## Transactions et concurrence

Les écritures prennent le verrou transactionnel PostgreSQL `pg_advisory_xact_lock(226202611)` **avant** de relire acteur, permissions, cible et hiérarchie. La création de session et l’inscription publique prennent le même verrou, pour éviter une session créée après une suspension ou une inscription rattachée à un commercial devenu inactif. Ce verrou global est adapté au volume initial ; il devra être réévalué et testé sur PostgreSQL natif avant montée en charge. Tout nouveau service qui écrit la hiérarchie ou les rôles doit participer au même protocole.

Chaque PATCH exige `expectedUpdatedAt` fourni par la dernière lecture. Un formulaire obsolète reçoit 409 `STALE_UPDATE` et propose de recharger les informations. Les changements de User, UserHierarchy, profil, révocation et AuditLog sont atomiques. Un doublon téléphone/email retourne 409 sans changement partiel. Aucun schéma supplémentaire n’est nécessaire.

Rôle, statut, rattachement, téléphone ou email modifiés : les sessions de la cible sont supprimées. Un transfert révoque aussi les sessions du sous-arbre déplacé. Un changement du téléphone remet `phoneVerifiedAt` à null. Les autres profils ne sont pas déconnectés pour un simple changement de nom. Les enfants d’un compte suspendu conservent leur propre statut : suspendre un responsable ne suspend pas automatiquement toute l’équipe. La réactivation exige une nouvelle connexion et ne restaure aucun ancien cookie.

## Historique et API

| Méthode / route                 | Comportement                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| GET `/api/v1/users`             | Liste paginée ; paramètres `page`, `q`, `role`, `status`                                      |
| POST `/api/v1/users`            | Crée un compte subordonné et son audit, réponse 201                                           |
| GET `/api/v1/users/:id`         | Détail autorisé avec `updatedAt`, responsable, société et indicateur de commercial par défaut |
| PATCH `/api/v1/users/:id`       | Modifie les seuls champs validés avec contrôle de version                                     |
| GET `/api/v1/users/parents`     | Parents actifs autorisés ; `role`, `companyId`, `targetId`, `q`                               |
| GET `/api/v1/users/:id/history` | Événements USER_CREATED/USER_UPDATED, 20 par page                                             |

Les mutations exigent l’origine autorisée, du JSON de moins de 8 Kio et la permission serveur. Limite persistante : 60 écritures par acteur sur 15 minutes. Réponses privées sans cache. Les cibles hors périmètre répondent 404, y compris pour l’historique. L’API ne transmet ni mot de passe, ni hash, ni document privé.

L’historique enregistre l’acteur, la société, la cible, la date, les codes de rôle/statut avant et après, les identifiants de rattachement, le nombre de sessions révoquées et les noms des champs de profil modifiés. Les valeurs des coordonnées et les mots de passe ne sont pas journalisés. L’interface ne sérialise que les métadonnées explicitement autorisées. Elle ne propose aucune suppression de journal.

## Vérification

Tests écrits : validation stricte des entrées ; création et identifiant ; rôles, sociétés, pairs et auto-modification ; CSRF ; suspension et ancien cookie ; formulaire obsolète et unicité ; cycles et rétrogradation ; transferts de sous-arbre ; protection du commercial par défaut ; filtres et historique ; rattachements concurrents ; parcours de gestion sur ordinateur et mobile. L’exécution se fait en fin de livraison, conformément à la demande utilisateur. Résultats réels dans [verification.md](verification.md).

Les tests d’intégration utilisent exclusivement `TEST_DATABASE_URL` vers une base locale dédiée, avec migrations et seed. Ils ne doivent pas viser la base de travail. Le protocole de concurrence doit également être validé sur PostgreSQL natif : une exécution sérialisée sur Prisma/PGlite ne constitue pas une validation de charge.
