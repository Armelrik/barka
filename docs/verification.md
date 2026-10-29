# Vérification de la phase 1 — 29 octobre 2026

Environnement : Windows, Node 24.21.0, npm 11.19.0. Next.js 16.4.3, Prisma CLI/client/adaptateur PostgreSQL 7.10.1, TypeScript strict 5.9.3. Versions résolues consignées dans `package-lock.json`.

| Contrôle exécuté                                  | Résultat                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Validation et format du schéma Prisma             | Réussite                                                                                                  |
| Génération du client Prisma                       | Réussite                                                                                                  |
| Génération SQL initiale depuis un schéma vide     | Réussite                                                                                                  |
| `npm run lint`                                    | Réussite, aucun avertissement                                                                             |
| `npm run typecheck`                               | Réussite                                                                                                  |
| `npm test`                                        | 14 tests réussis : RBAC et filtres                                                                        |
| `npm run build`                                   | Réussite ; accueil, 404 et 4 fiches pré-rendus                                                            |
| `npm run test:e2e` sur compilation de production  | 4 tests réussis : 2 ordinateur, 2 mobile Chromium                                                         |
| Inspection des captures de l'accueil              | Ordinateur et mobile ; pas de débordement horizontal dans les formats testés                              |
| `npm run db:deploy` sur base locale Prisma/PGlite | 2 migrations appliquées, contraintes SQL incluses                                                         |
| `npm run test:db` sur cette base locale           | Deux seeds successifs, aucun doublon ni changement des hash, prix, paramètres ou identifiants existants   |
| Démonstration en base                             | 7 comptes, 6 rattachements, 2 identifiants démarcheurs uniques, 4 biens et annonces en brouillon, 3 plans |
| `npm ls --depth=0`                                | Réussite, versions directes cohérentes                                                                    |
| `npm ci --dry-run --ignore-scripts --offline`     | Résolution du verrou réussie ; ce contrôle ne constitue pas une réinstallation complète                   |
| Audit automatique de `npm install`                | 0 vulnérabilité signalée au moment de la vérification                                                     |

## Limites précises

Docker et un serveur PostgreSQL natif ne sont pas disponibles sur ce poste. Les migrations et le seed ont été réellement exécutés avec Prisma Postgres local, basé sur PGlite, via son interface PostgreSQL. Il reste à répéter la vérification sur PostgreSQL 17 avec Docker Compose ou le service managé retenu avant de valider l'environnement de déploiement.

Les tests E2E utilisent une émulation mobile Chromium ; ils ne remplacent pas les essais sur appareils physiques et Safari. Les captures vérifient la direction visuelle et le débordement, pas une certification d'accessibilité.

ESLint 9.39.5 est épinglé pour respecter les peer dependencies des plugins React/import/accessibilité de la configuration Next.js. Sa mise à niveau devra accompagner celle de ces plugins ; aucune résolution forcée de leurs peers n'est conservée.

Aucun test ne valide encore l'authentification, les CRUD privés, les opérations foncières, les uploads, les réservations, les abonnements, les paiements, les notifications ou une vraie visite 360° : ces fonctionnalités sont hors de la présente livraison. Aucune identité, pièce d'identité, clé d'API, photographie ou donnée client réelle utilisée.

Sous ce bac à sable Windows, `tsx` et la fermeture de l'arbre des processus Playwright ont nécessité une exécution autorisée hors restriction. Les vérifications correspondantes ont ensuite abouti avec un code de sortie 0.

## Refonte visuelle de l'accueil

L'accueil a été reconstruit à partir de la référence fournie : hero architectural photographique, Poppins auto-hébergée dans tout le site, galerie photographique, palette ivoire/brun et boutons en pilule. Les fiches suivent la même direction. Provenance, licence de police et prompts : [design.md](design.md).

Le lint, le typecheck, les 14 tests unitaires et la compilation de production ont été relancés avec succès. La suite navigateur couvre désormais 6 parcours ordinateur/mobile : recherche et fiche, état vide, favoris persistants après rechargement et menu mobile. Elle vérifie aussi la cohérence de la police entre titre et corps, l'absence de débordement et le chargement effectif des visuels de la galerie. Les favoris sont locaux à l'appareil, sans compte ni synchronisation serveur.
