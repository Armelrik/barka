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

## Reprise de la charte Afriloc — 9 novembre 2026

Référence : dépôt `Armelrik/afriloc`, commit `dc651bef074e824af63237b4f00e5771f6b2a1d7`. Gabarits et feuilles de style extraits dans [reference-afriloc](reference-afriloc/README.md). Les 11 images de `public/afriloc` ont été comparées par SHA-256 aux fichiers sources : copies identiques.

Contrôles exécutés après adaptation : lint, TypeScript, compilation de production et 29 tests unitaires réussis. Les 10 parcours Playwright ordinateur/mobile vérifient accueil, chargement des images, recherche combinée, fiche, état vide, favoris persistants, menu mobile, palette orange/turquoise, header fixe, ouverture/fermeture de la connexion modale, absence de débordement sur catalogue/contact/inscription et absence de chevauchement entre boutons du hero et statistiques. Captures d'accueil, catalogue, contact et inscription produites ; accueil, catalogue et inscription inspectés visuellement.

Les pages et fenêtres de connexion gardent les formulaires et endpoints existants. Aucun schéma, paiement ou droit métier n'a été modifié. Les styles des espaces client et équipes sont adaptés, mais la suite d'authentification avec écritures en base n'a pas été relancée : `TEST_DATABASE_URL` n'est pas configurée et le serveur local de `DATABASE_URL` refuse la connexion. Aucun compte ni mot de passe n'a été changé.

La reprise reproduit les sources graphiques sur les écrans présents dans Barka ; elle ne constitue pas une comparaison pixel à pixel avec une instance Laravel exécutée. Les différences liées aux fonctions encore absentes et aux données fictives sont répertoriées dans la référence. La version anglaise, la newsletter et l'envoi du formulaire de contact restent inactifs.

## Gestion des utilisateurs et équipes — 9 novembre 2026

Création de comptes subordonnés, modification du profil/rôle/statut, rattachements, filtres et historique intégrés à l’interface Afriloc. Les mutations relisent l’acteur dans une transaction protégée par un verrou partagé avec l’inscription et la création des sessions. Contrôle de version `expectedUpdatedAt`, validation des ancêtres/enfants, protection du commercial par défaut, audit atomique et révocation des sessions. Détails et limites : [team-management.md](team-management.md).

Vérifications regroupées après l’implémentation, à la demande de l’utilisateur :

| Contrôle                             | Résultat                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| Lint                                 | Réussite                                                                             |
| TypeScript                           | Réussite                                                                             |
| Tests unitaires                      | 36 réussis                                                                           |
| Compilation de production            | Réussite, nouvelles pages et API d’équipe incluses                                   |
| Parcours publics de non-régression   | 10 réussis, ordinateur/mobile                                                        |
| Authentification et gestion d’équipe | 26 scénarios vérifiés : 20 API/sécurité, 6 parcours ordinateur/mobile                |
| Migrations et seed sur base isolée   | 3 migrations appliquées, seed fictif exécuté                                         |
| Inspection graphique                 | Capture de gestion de compte mobile inspectée ; captures ordinateur/mobile produites |

Les deux nouveaux tests d’interface ont été corrigés pour attendre la fin effective de la connexion avant de naviguer vers l’annuaire. Les 24 autres scénarios ont réussi au premier passage ; seuls ces deux parcours ont ensuite été relancés et ont réussi. Les assertions couvrent création professionnelle et identifiant, rôles interdits, autres sociétés/équipes, auto-modification, CSRF, suspension et cookie révoqué, réactivation, doublon et rollback, formulaire obsolète, cycle et rétrogradation, transfert d’équipe, révocation du sous-arbre, parents proposés, commercial par défaut, filtres et historique sans coordonnées privées.

Un test de deux rattachements concurrents vérifie qu’une seule opération réussit et qu’aucun cycle n’est créé. Environnement : base **Prisma/PGlite isolée**, nom `barka-team-tests-20261109`, pool de taille 1, un worker. Cette exécution ne valide pas les charges concurrentes sur PostgreSQL natif. Le pont a émis un avertissement de dépréciation `pg` sur l’exécution de requêtes ; aucune erreur finale des scénarios vérifiés. Les données des fixtures ont été nettoyées ; le seed de test reste dans cette base isolée. La configuration `.env` et la base de travail n’ont pas été modifiées.

L’instance de prévisualisation publique a été redémarrée sur le port 3010 après compilation. La remise en route de la base de travail et la validation PostgreSQL native restent nécessaires pour utiliser et valider ces fonctions sur cet environnement hors tests.

## Visites immersives, carte et présentation du catalogue — 9 novembre 2026

Ajout des dossiers immobiliers, médias privés, validation des identités, modération et catalogue publié. Le lecteur affiche des panoramas équirectangulaires par pièce, des points de navigation, un plan facultatif et des modèles GLB autonomes. La carte publique utilise uniquement les coordonnées autorisées et arrondies. Les fichiers de démonstration sont des scènes géométriques fictives, sans données client.

Le catalogue de présentation comprend huit biens fictifs personnalisés à Ouagadougou et Bobo-Dioulasso. Les photos d’illustration proviennent du dépôt Afriloc fourni et sont réutilisées entre exemples ; elles ne constituent pas un reportage réel de ces biens. Un carrousel commun aux cartes et fiches propose flèches, sélection directe, compteur, clavier et défilement tactile, sans lecture automatique. Il fonctionne aussi pour les photos publiées de la base.

Les vérifications utilisent uniquement la base isolée `barka-property-tests-20261109` et des fichiers de test locaux. Aucune migration sur la base de travail ni modification du fichier `.env`. Le stockage S3 et PostgreSQL natif en charge restent à vérifier avant une ouverture commerciale. Configuration et limites : [property-management.md](property-management.md).

Résultats finaux de cette étape :

| Contrôle                                                     | Résultat                                                                                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| ESLint et compilation de production avec contrôle TypeScript | Réussite                                                                                                                                    |
| Tests unitaires                                              | 45 réussis                                                                                                                                  |
| Parcours publics ordinateur et mobile                        | 16 scénarios validés : 15 au passage final, puis le seul test tactile rejoué avec succès après correction de son événement simulé           |
| Dossiers immobiliers                                         | 11 réussis : 9 API et 2 interfaces ordinateur/mobile                                                                                        |
| Base isolée                                                  | 4 migrations appliquées, seed fictif ; serveur de test arrêté après vérifications                                                           |
| Traitement des suppressions                                  | Commande exécutée sur la base isolée, aucune tâche en attente ; suppression physique S3 non testée                                          |
| Inspection visuelle                                          | Catalogue ordinateur, dossier privé et galerie mobile inspectés                                                                             |
| Prévisualisation publique                                    | Serveur 3010 actualisé ; `/biens`, `/carte`, `/visites/demo` répondent 200 sur le tunnel public, huit carrousels présents dans le catalogue |

Les tests de confidentialité utilisent les endpoints publics de fiche et de visite pour vérifier les statuts HTTP 404. Les pages Next.js peuvent rendre leur écran introuvable avec un statut 200 lorsque le streaming a déjà commencé, conformément à la documentation locale. Les captures utilisent une échelle CSS ; l’accueil présente trois biens en vedette et renvoie au catalogue complet. Le test tactile doit fournir un identifiant de contact à Playwright.

Après inspection de la galerie mobile, l’espacement et le retour à la ligne des boutons de la fiche ont été corrigés. Compilation réussie, puis les deux parcours carrousel ordinateur/mobile ont été rejoués avec succès, avec une assertion explicite sur l’absence de chevauchement des boutons. Le serveur public a été actualisé avec cette dernière compilation.

## Demandes et suivi des visites — 9 novembre 2026

Ajout des formulaires de proposition d’horaire, de `/espace/visites`, des listes personnelles/équipe, filtres/pagination, décisions et annulation. Règles et limites dans [visits.md](visits.md). Les réponses ne contiennent pas de téléphone/email, document ni détail d’un rendez-vous concurrent. Les décisions sont auditées, soumises à contrôle de version et relisent les droits dans la transaction.

| Contrôle                                                        | Résultat                                                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Lint, compilation de production et TypeScript                   | Réussite                                                                                                                             |
| Tests unitaires                                                 | 51 réussis, dont 6 sur dates, états et validation des demandes                                                                       |
| Parcours publics ordinateur/mobile                              | 18 réussis, dont 2 simulations de demande sans écriture                                                                              |
| Demandes de visite sur base isolée                              | 8 réussis : 6 API et 2 parcours client/équipe ordinateur/mobile                                                                      |
| Régression du formulaire après correction d’un horaire invalide | 2 parcours ciblés ordinateur/mobile réussis sur la compilation finale                                                                |
| Migration                                                       | Cinquième migration `202611090005_visits` appliquée à la base isolée existante, sans modification de `.env` ni de la base de travail |
| Inspection                                                      | Captures de suivi d’équipe ordinateur et mobile inspectées, sans débordement horizontal                                              |
| Prévisualisation                                                | Serveur du port 3010 actualisé ; fiche accessible en HTTP 200 sur le tunnel public, formulaire et mention de simulation présents     |

Les scénarios API couvrent session et origine, dates hors limites, annonce non publiée, propre bien, doublon actif, accès privé, autre demandeur, autre société, version obsolète, motifs de refus, compte/annonce suspendus, annulation, nouvelle proposition et clôture après la fin du créneau. Deux confirmations incompatibles sont lancées en parallèle : une seule est acceptée et auditée, sans divulguer le demandeur de l’autre visite.

Environnement de concurrence : Prisma/PGlite isolé `barka-property-tests-20261109`, pool de taille 1. Ce contrôle ne valide pas une charge concurrente PostgreSQL native ; celle-ci reste à réaliser avant exploitation commerciale. Les fixtures ont été nettoyées et le serveur de base de test arrêté après exécution. L’hébergement de présentation reste en mode demo : aucune demande réelle n’est enregistrée depuis les exemples fictifs, et aucun SMS/email n’est envoyé.

## Préparation comptes et migrations pour Vercel/Neon — 9 novembre 2026

Ajout d’une sixième migration de références RBAC, d’une initialisation production distincte du seed fictif, de `DIRECT_URL` pour les migrations et de scripts d’inspection/validation. `vercel.json` utilise `build:vercel` ; l’installation conserve explicitement Prisma/tsx nécessaires au build. Le bootstrap et le seed ne s’exécutent jamais automatiquement au build. Une Preview refuse les migrations automatiques. Les secrets restent hors Git et hors envoi CLI Vercel via les règles d’exclusion ; `.env.bootstrap` est privé et ignoré.

| Contrôle                              | Résultat                                                                                                                                                                                     |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint, TypeScript et compilation       | Réussite                                                                                                                                                                                     |
| Tests unitaires                       | 60 réussis                                                                                                                                                                                   |
| Parcours publics ordinateur/mobile    | 18 réussis                                                                                                                                                                                   |
| Migrations sur base vierge            | Six migrations appliquées sur deux bases locales de test isolées, sans seed préalable                                                                                                        |
| Initialisation production             | Deux comptes, droits, rattachement et identifiant du commercial par défaut validés ; relance sans doublon ni changement de mot de passe ; collision annulée atomiquement                     |
| Authentification des comptes initiaux | Connexion serveur du superadministrateur et session persistée ; inscriptions fermées par défaut, puis inscription CLIENT rattachée au compte d’accueil avec session vérifiée sur base isolée |
| Seed de démonstration séparé          | Deux exécutions réussies, 7 comptes et 8 brouillons, hash/prix/paramètres/numéros conservés ; assertion du nombre de biens mise à jour                                                       |
| Limites des médias Vercel             | 4 Mio côté formulaire/serveur ; tests du corps sans Content-Length, fichier trop grand dans multipart et résultat de traitement trop grand, tous refusés avant stockage                      |
| Origines Preview                      | Variable Vercel contrôlée acceptée, faux Host/origine refusés ; cookie HTTPS conservé                                                                                                        |
| Garde de migration                    | `RUN_DATABASE_MIGRATIONS=true` sur Preview rejeté avant toute connexion de migration                                                                                                         |
| Inspection                            | Script exécuté sur base isolée : connexion, historique de six migrations et nombres de comptes, sans URL ni donnée d’identification                                                          |

Les bases `barka-production-tests-20261109` et `barka-production-auth-tests-20261109` utilisent Prisma/PGlite local. Cela ne valide pas Neon en conditions réelles, S3, le build exécuté sur Vercel ni la charge PostgreSQL native. Aucune migration distante, initialisation de comptes réels, modification du `.env` de travail ou publication Vercel n’a été effectuée : le seul accès configuré reste local et la connexion du projet Neon Barka est nécessaire. Guide d’application : [vercel-neon.md](vercel-neon.md).

Sur Vercel, les gros panoramas/GLB sont limités à 4 Mio pour rester sous la limite des fonctions ; la chaîne de dépôt direct avec validation et distribution adaptée reste à développer pour les fichiers plus lourds. Le stockage privé S3 et les variables d’hébergement doivent être configurés avant la mise en ligne fonctionnelle.

## Connexion effective et migrations sur Neon Barka — 9 novembre 2026

Connexion distante fournie par l’utilisateur, stockée uniquement dans `.env` privé (permissions 600), avec `DATABASE_URL` mutualisée et `DIRECT_URL` directe. Les trois migrations déjà appliquées ont été comparées par SHA-256 aux fichiers du dépôt : historique conforme. Aucun doublon actif de demande de visite avant ajout de l’index unique.

Les migrations `202611090004_immersive`, `202611090005_visits` et `202611090006_production_roles` ont été appliquées avec `prisma migrate deploy`. Vérification distante réussie : six migrations terminées, champs message/réponse des visites présents et six permissions du rôle SUPER_ADMIN. Les comptages avant/après sont identiques : 7 utilisateurs, 1 société, 4 biens, 4 annonces, 0 demande de visite et 0 paiement. Ce contrôle des comptages ne remplace pas une sauvegarde ou une comparaison intégrale des contenus.

Les sept comptes de seed préexistants sont toujours actifs ; aucun compte réel n’a encore été créé faute de noms et téléphones renseignés dans `.env.bootstrap`. Le secret de session local a été généré sans affichage et la société cible d’inscription configurée sur BARKA. Aucun seed n’a été relancé sur Neon, aucun compte n’a été supprimé ou promu, aucune publication Vercel n’a été effectuée. Le mot de passe de connexion communiqué dans le chat doit être renouvelé dans Neon et reporté dans les configurations privées.

## Création effective des comptes initiaux sur Neon Barka — 9 novembre 2026

Après correction et validation du fichier privé `.env.bootstrap`, `npm run db:bootstrap` a créé les deux comptes de la société BARKA sur Neon : SUPER_ADMIN et DEFAULT_COMMERCIAL, actifs. Le hachage du mot de passe administrateur, le parent du compte d’accueil, son profil et son affectation comme commercial par défaut ont été vérifiés sans afficher les identifiants. Les sept comptes de démonstration préexistants restent inchangés ; leur désactivation avant mise en production reste à traiter.

Vérification HTTP sur le serveur local `127.0.0.1:3010` : connexion du nouvel administrateur 200, accès à l’API de gestion des utilisateurs 200, puis déconnexion de la session de contrôle 200. Le contrôle automatique a refusé le test de connexion via le tunnel Cloudflare public afin d’éviter d’y transmettre le mot de passe réel ; cette requête n’a pas été exécutée. L’alternative locale a permis le contrôle sans transmission du mot de passe à Cloudflare. Les fichiers `.env` et `.env.bootstrap` sont toujours exclus de Git. Aucun déploiement Vercel n’a été réalisé à cette étape.

## Préparation du retrait des comptes fictifs et configuration Vercel — 9 novembre 2026

Ajout de `db:retire-demo`, avec simulation par défaut, reconnaissance stricte des sept comptes de seed de BARKA-DEMO et vérification préalable des deux comptes réels. La simulation sur Neon reconnaît sept comptes actifs et zéro session à révoquer. Le mode d’application suspend uniquement ces comptes, révoque leurs sessions et audite les changements dans une transaction protégée par le verrou partagé des identités ; il reste soumis à confirmation explicite. L’exécution a été refusée par le contrôle automatique faute d’accord explicite de l’utilisateur : aucune désactivation n’a eu lieu à cette étape. Lint et TypeScript réussis.

Le fichier `.env.vercel` privé a été préparé localement, avec les connexions Neon et un secret de session distinct, sans afficher ses valeurs. Il est ignoré par Git. Les informations du projet Vercel et du stockage S3 restent à fournir ; aucune publication ni connexion au bucket n’a été tentée.

## Choix Neon Object Storage et conservation des comptes fictifs — 9 novembre 2026

L’utilisateur a explicitement demandé de conserver les sept comptes de démonstration : la commande de retrait n’a pas été exécutée, aucune session de ces comptes n’a été révoquée. Le stockage retenu pour les médias est Neon Object Storage, associé au projet Barka.

La documentation officielle Neon confirme la compatibilité avec le SDK S3 déjà utilisé et l’adressage par chemin configuré dans Barka. Ajout de `storage:check` : contrôle du bucket, puis avec `--probe` dépôt/relecture d’un fichier de test aléatoire, contrôle du refus de lecture anonyme et suppression de ce seul fichier. Le script réutilise le client et les fonctions de stockage de l’application.

Le contrôle a constaté l’absence de S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID et S3_SECRET_ACCESS_KEY dans `.env.vercel`. Aucun appel distant Object Storage ni dépôt de média n’a donc été effectué ; l’accès au bucket et sa confidentialité restent à vérifier après configuration. Les identifiants PostgreSQL existants ne sont pas des clés Storage. Aucun secret n’a été affiché et aucun déploiement Vercel n’a eu lieu.

## Connexion effective à Neon Object Storage — 9 novembre 2026

Accès Storage fournis par l’utilisateur, enregistrés exclusivement dans `.env` et `.env.vercel` privés (permissions 600). Liste des buckets obtenue sans afficher les clés. Les ACL lues ne déclaraient pas de droit public, mais le test réel du bucket `barka-media` a révélé une lecture anonyme en HTTP 200 ; sa politique autorise effectivement un accès public. Ce bucket n’est pas retenu, et sa politique n’a pas été modifiée.

Le bucket existant `barka-uploads` a passé le contrôle complet avec le connecteur de l’application : HeadBucket réussi, dépôt d’une image d’illustration sous UUID aléatoire, relecture identique octet par octet, lecture anonyme refusée en HTTP 403, puis suppression du fichier de test. Aucun objet existant ni compte utilisateur n’a été modifié par ces contrôles. Les fichiers temporaires des deux essais précédents ont aussi été supprimés. La configuration des deux environnements privés utilise désormais `barka-uploads` et `MEDIA_DRIVER=s3`.

La version web locale sur 3010 a été relancée pour charger cette configuration, avec son origine HTTPS temporaire existante. Les sept comptes de démonstration restent conservés conformément à la demande. Les clés communiquées dans le chat doivent être renouvelées puis reportées dans les fichiers privés et variables d’hébergement. Le projet/domaine Vercel reste à préciser ; aucune publication Vercel n’a été effectuée.

## Mise en production Vercel — 9–10 novembre 2026

Projet existant `armelriks-projects/barka`, lié au dépôt local. Connexion Vercel `armelrik` vérifiée après autorisation navigateur. Lecture des domaines via API : `barka-ten.vercel.app` vérifié. `AUTH_URL` configuré sur cette origine. Vingt variables ajoutées à Production ; connexions Neon, clés Storage et secret de session marqués sensibles, valeurs transmises au CLI par entrée standard sans affichage. Fichiers privés exclus de Git et du transfert de source ; `.env.local` généré par la liaison et l’authentification CLI sont protégés.

Compilation locale réussie, puis déploiement de production `dpl_FYrsHy1MAzvqTNfEvf3nGHzeyRh7` confirmé READY par l’API Vercel. Node.js 26.x sur Vercel. Alias canonique https://barka-ten.vercel.app et alias de projet attribués. Les six migrations existaient déjà sur Neon ; `RUN_DATABASE_MIGRATIONS=false` a évité toute mutation de schéma au build. Les sept comptes fictifs restent conservés.

Contrôles HTTP réels sur le domaine canonique : accueil, `/biens`, `/connexion`, `/visites/demo`, `/carte` en 200, contenu Barka vérifié. `/api/v1/catalog` en 200, zéro annonce publiée attendu en mode database. `/api/v1/properties` sans session en 401. POST connexion avec corps vide sur la bonne origine en 400 (validation et accès au limiteur en base) ; origine étrangère en 403. Aucun mot de passe de compte réel envoyé par ces tests, aucune inscription créée. Le dépôt/lecture/suppression Storage depuis Vercel avec un utilisateur connecté reste à vérifier manuellement ; le connecteur Storage a déjà passé le test réel depuis le Mac.

Installation du guide officiel Vercel : CLI utilisateur 65.14.0 et plugin utilisateur installés, serveur MCP global officiel configuré, OAuth terminé. Outils MCP absents du catalogue de la session active, donc contrôle `list_teams` non exécuté via MCP et rechargement Codex requis. Cette limite n’a pas bloqué le déploiement via CLI. Guide détaillé : [vercel-neon.md](vercel-neon.md).

## Comptes, back-office et dix exemples — 10 novembre 2026

Inscriptions CLIENT autorisées explicitement par l’utilisateur : REGISTRATION_ENABLED et LEGAL_DOCUMENTS_APPROVED activés dans les fichiers privés locaux et les variables Vercel Production. Ajout du tableau de bord par périmètre, activité filtrée, paramètres de société versionnés, espace sécurité et changement/réinitialisation de mot de passe avec révocation des sessions. Les permissions existantes restent contrôlées au serveur.

Migration additive 202611100007_showcase appliquée sur Neon. Import exécuté une seule fois : dix annonces fictives publiées, cinq attribuées au COMMERCIAL et cinq au DEFAULT_COMMERCIAL existants. Sept comptes fictifs actifs conservés et quatre anciens brouillons conservés. Photos illustratives déposées dans le stockage privé. Les exemples portent un marquage explicite et refusent toute demande réelle de rendez-vous ; aucune identité ou pièce légale n’a été fabriquée. Une seconde exécution de l’import a été refusée par le contrôle automatique ; les comptages et attributions ont été confirmés en lecture seule.

Vérifications : 64 tests unitaires, 18 tests navigateur publics, lint et TypeScript réussis. Les 53 scénarios authentifiés ont été validés sur une base locale isolée avec sept migrations : 46 réussis au premier passage, puis sept reprises réussies après correction du nettoyage des compteurs d’entrée dans le harnais de test. Le limiteur applicatif reste actif. Les tests supplémentaires du tableau de bord passent sur mobile et ordinateur. Compilation de production réussie. Aucun mot de passe réel envoyé à un tunnel public par ces tests.

Guide fonctionnel et limites : [backoffice.md](backoffice.md).

Déploiement final `dpl_DkerwTXFm15SLGtbLj9qW2hhmk3W` confirmé READY sur https://barka-ten.vercel.app. Six pages publiques en 200, catalogue connecté de dix annonces toutes fictives avec photos ; neuf médias distincts en 200 image/jpeg. Fiche d’exemple et mention EXEMPLE FICTIF vérifiées. API propriétés et réglages sans session en 401, `/admin` contient la redirection Next.js vers la connexion, inscription vide en 400 sans création de compte. Aucun mot de passe réel utilisé pour ces contrôles publics. Le parcours authentifié est testé sur la base isolée, pas avec les identifiants réels en Production.

## Cohérence de la présentation client — 10 novembre 2026

Charte Afriloc conservée. Accueil sans compteurs commerciaux fictifs, parcours d’inscription client distinct de l’accès professionnel, navigation active sur les fiches et identité du compte connecté obtenue côté serveur. Pied de page recentré sur les liens utilisables : retrait des réseaux sociaux sans destination, newsletter désactivée et coordonnées non renseignées. Page Contact remplacée par les parcours de recherche, visite et gestion professionnelle, avec questions fréquentes et limites explicites. Le catalogue connecté affiche un titre principal, le nombre de résultats, le type et une action vers la fiche ; les caractéristiques à zéro ne sont plus affichées.

Le guide [client-demo.md](client-demo.md) décrit désormais la version Vercel et les dix exemples sur Neon, les accès et le parcours de présentation. Aucun compte, attribution ou contenu de la base n’a été modifié lors de cette harmonisation. Compilation de production et lint réussis.

Déploiement `dpl_5CY3EwMJnxFUe4W3bQoYt3cPLvMm` confirmé READY sur le domaine canonique. Dix-huit scénarios publics validés sur ordinateur/mobile : dix-sept au premier passage, puis le scénario d’accueil repris seul avec succès après dépassement du délai global de trente secondes sous quatre workers. Aucune assertion supprimée. Contrôles navigateur réels en Production : accueil, catalogue et guide sans débordement aux deux tailles, dix cartes fictives, photos lisibles et filtre location ramenant cinq biens. Contrôles en lecture seule, sans inscription ni demande réelle créée.
