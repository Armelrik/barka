# Vérification de la phase 1 — 29 octobre 2026

## Ajout du premier espace authentifié

Inscription CLIENT, connexion téléphone/email, déconnexion, sessions scellées et révocables, premier tableau de bord et annuaire d'équipe en lecture seule. Les routes privées relisent le statut, le rôle et les permissions en base. Détails : [authentication.md](authentication.md).

Contrôles relancés : lint et TypeScript sans erreur, compilation Next.js réussie, 29 tests unitaires réussis, 6 parcours publics réussis et 10 scénarios d'authentification/API réussis (8 sécurité/API, 2 parcours client ordinateur/mobile). La migration `202610290003_auth` a été appliquée et le seed rejoué deux fois sans modification de ses comptes, mots de passe ou paramètres existants. Le script de vérification distingue désormais les fixtures du seed des nouveaux comptes clients. Les comptes de démo ont aussi été rendus utilisables via `db:demo-password`, sans affichage du secret local.

Deux parcours supplémentaires ont ensuite réussi sur le même build : tableau de bord manager et annuaire de ses deux descendants sur ordinateur et mobile, sans débordement horizontal de la page. La suite d'authentification comprend désormais 12 scénarios. Capture de l'annuaire ordinateur inspectée. La résolution du verrou `npm ci --dry-run --ignore-scripts --offline` réussit ; une installation complète sur Mac n'est pas revendiquée.

Cas de sécurité exécutés : refus anonyme, rôle CLIENT et rattachement imposés, email facultatif, unicité, cookie falsifié, cookie révoqué, expiration, suspension, relecture du rôle, équipe descendante, société étrangère, CSRF, type JSON et limites persistantes malgré un en-tête IP modifié. Les captures des formulaires et de l'espace client ont été inspectées sur ordinateur et mobile.

Limite d'environnement : les tests d'authentification utilisent Prisma/PGlite avec un pool de taille 1 et un seul worker ; son pont PostgreSQL a présenté des erreurs de protocole en connexions concurrentes. La validation de charge/concurrence sur PostgreSQL natif reste à exécuter avant ouverture publique. Docker est toujours absent sur ce poste. Les textes juridiques sont des documents de travail et l'inscription en production est fermée par défaut.

Les sections suivantes conservent l'historique des fondations et de la refonte.

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

## Identité bleu nuit et or

Palette de la planche de marque appliquée au site, logo vectoriel adapté sur fonds clair/sombre et favicon ajoutés. Après cette modification : lint, typecheck, 14 tests unitaires, compilation et 6 parcours Playwright réussis. Capture ordinateur inspectée. Contrastes calculés des couleurs retenues : bleu nuit sur or 7,61:1 ; blanc sur bleu nuit 15,59:1 ; texte secondaire du bloc sombre 11,91:1. Ces mesures concernent ces paires de couleurs, pas une certification globale d'accessibilité. Voir [brand.md](brand.md).
