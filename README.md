# BARKA SARL

Site en ligne : [barka-ten.vercel.app](https://barka-ten.vercel.app). Déploiement Vercel connecté à Neon et au bucket privé `barka-uploads`.

Interface : reprise de la version Afriloc validée par le client (Inter, orange/turquoise). Sources, charte complète et correspondance des écrans : [référence Afriloc](docs/reference-afriloc/README.md).

Plateforme immobilière et foncière — fondations et premier espace authentifié. Next.js App Router, React, TypeScript strict, Tailwind, composants compatibles shadcn/ui, Lucide, PostgreSQL/Prisma. Aucun Laravel.

Reprise sur un autre poste : [guide Mac](docs/mac-handoff.md). Visualisation immersive : [visionneuse des biens](docs/property-viewer.md). Parcours de présentation client : [guide de démonstration](docs/client-demo.md).

Demandes de visite : [parcours client et équipe](docs/visits.md), avec suivi privé et contrôle des conflits d’horaires.

## Démarrer l'interface

Node.js >= 22.12 (Node 24 LTS conseillé), npm. Sous PowerShell avec scripts désactivés, utiliser `npm.cmd` et `npx.cmd`.

```sh
npm ci
npm run setup:local
npm run dev
```

Ouvrir http://localhost:3000. L'accueil et les fiches fictives fonctionnent sans PostgreSQL et sans secret. Aucune donnée utilisateur réelle à utiliser à cette étape. Les liens de recherche fonctionnent sur un jeu de démonstration local.

Pour utiliser `/inscription`, `/connexion` et `/espace`, préparer la base ci-dessous. [Architecture et sécurité de l'authentification](docs/authentication.md).

## Préparer PostgreSQL et les exemples

Docker avec Compose requis pour l'option locale ; sinon fournir une base PostgreSQL accessible dans `DATABASE_URL`.

```sh
docker compose up -d
npm run db:validate
npm run db:deploy
# Dans .env, définir DEMO_PASSWORD (12 caractères minimum, 72 octets maximum).
npm run db:seed
npm run db:seed
```

Les comptes de démonstration utilisent le mot de passe `DEMO_PASSWORD` de votre `.env`. Pour appliquer ce mot de passe à des comptes fictifs déjà existants : `npm run db:demo-password` (local uniquement, révoque leurs sessions). Aucun secret n'est affiché ni poussé dans Git.

Contrôle reproductible sur une base locale de test dédiée, migrations appliquées : définir `TEST_DATABASE_URL`, puis lancer `npm run test:db`. Ce contrôle relance le seed deux fois avec des mots de passe distincts et vérifie les comptes, les hash inchangés, les prix, les paramètres, la hiérarchie et les identifiants des démarcheurs. Il ajoute uniquement des données de démonstration et refuse une base distante.

Le seed transactionnel utilise des upserts et un verrou d'exécution ; un second passage ne duplique pas les données et ne réinitialise pas les mots de passe, prix ou paramètres existants. Comptes `super_admin@barka.example`, `admin@barka.example`, `supervisor@barka.example`, `manager@barka.example`, `commercial@barka.example`, `default_commercial@barka.example`, `client@barka.example`. Identifiants fictifs, téléphones de test non utilisables. Connexion disponible sur /connexion avec le mot de passe local DEMO_PASSWORD. Ne pas déployer ces comptes en production ; le seed refuse `NODE_ENV=production`. Aucun paiement, document d'identité ni média tiers créé.

Lors d'une évolution du schéma : `npm run db:migrate -- --name nom_du_changement`. En déploiement, appliquer `db:deploy` séparément de la compilation.

## Vérifier

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Tests unitaires : limites RBAC (société, pays, hiérarchie, pairs, auto-modification, escalade) et combinaison des filtres. E2E : accueil, filtre, fiche, état vide, largeur mobile. Ils utilisent la compilation de production sur le port 3001 : lancer `npm run build` avant `npm run test:e2e`. Pas de promesse de couverture du produit futur.

## Livré et limites

- Interface française responsive reprise d’Afriloc : hero original, Inter auto-hébergée, palette orange/turquoise, galerie illustrative, recherche combinée, fiches et catalogue `/biens`.
- Favoris de démonstration conservés dans ce navigateur, filtre des favoris et menu mobile accessible. Les favoris associés à un compte restent à intégrer avec l'authentification.
- Schéma Prisma initial, migration et seed avec hiérarchie, localités de démonstration, tarifs et paramètres. Numérotation annuelle atomique des démarcheurs.
- Politique RBAC testée et appliquée aux lectures de l'équipe, avec refus des accès hors hiérarchie ou société.
- Inscription CLIENT, téléphone/email, sessions scellées `iron-session` et révocables en base, contrôle d'origine, limitations persistantes et audit. Espace client et gestion d’équipe : recherche, création de comptes subordonnés, profil/rôle/statut, rattachements et historique avec filtrage serveur. Voir [gestion des équipes](docs/team-management.md). Tests d'API et navigateur dédiés : `TEST_DATABASE_URL=... npm run test:auth` après compilation.
- Vérification d'intégration du seed : [scripts/verify-demo-seed.ts](scripts/verify-demo-seed.ts).
- Documentation : [exigences](docs/requirements.md), [architecture](docs/architecture.md), [RBAC](docs/rbac-matrix.md), [modèle de données](docs/data-model.md), [feuille de route](docs/roadmap.md).

Gestion immobilière et visites : [guide complet](docs/property-management.md). Dossiers dans `/espace/biens`, vérification dans `/espace/verification`, visite autonome dans `/visites/demo` et carte dans `/carte`. Le mode `CATALOG_MODE=database` affiche uniquement les annonces publiées et non expirées ; le mode `demo` reste disponible sans base. Médias réels hors de `public/`, S3 privé en hébergement, stockage local privé pour le développement. Appliquer les migrations avant utilisation.

À implémenter : vérification téléphone/email, activation de Resend pour la récupération et l’expédition, réservations du bien, abonnements, mock puis paiements réels, notifications et textes légaux définitifs. Les modèles correspondants ne constituent pas une implémentation de ces modules. L’aperçu reste `noindex` jusqu’au lancement.

## Hébergement

Déploiement Vercel + Neon Barka : [guide comptes, migrations et configuration](docs/vercel-neon.md). Initialisation sans seed fictif via `npm run db:bootstrap` ; contrôle en lecture seule via `npm run db:inspect`. Variables modèles dans `.env.vercel.example` et `.env.bootstrap.example`.

Compatible avec une cible Next.js Node sur Vercel ou VPS Node/Docker. PostgreSQL managé avec pool, stockage objet séparé, HTTPS, worker externe pour tâches et miniatures. Pas de simple hébergement PHP. Définir les variables d'environnement via le gestionnaire de secrets de l'hébergeur ; ne jamais préfixer les secrets par `NEXT_PUBLIC_`. Coûts et sauvegardes : voir [architecture](docs/architecture.md).

## Vérifications de cette livraison

Le résultat des commandes exécutées et les limites de l'environnement sont consignés dans `docs/verification.md` à la fin de la phase 1.

La charte actuelle et la provenance des visuels sont documentées dans [docs/reference-afriloc/README.md](docs/reference-afriloc/README.md). L’ancienne direction reste archivée dans [docs/design.md](docs/design.md). Les assets de `public/design` sont des ressources graphiques statiques ; les médias des futurs biens publiés utiliseront le stockage objet prévu.

Comptes et back-office : [guide des accès, réglages et exemples publiés](docs/backoffice.md). Dix biens fictifs sont attribués aux comptes de démonstration et visibles dans le catalogue connecté. Les inscriptions CLIENT sont ouvertes sur décision de l’exploitant.

Nouveaux parcours personnels : [récupération, notifications, favoris, recherches et agenda](docs/account-services.md). L’expédition Resend nécessite encore ses identifiants et un domaine validé.

Catalogue avancé, quartiers sourcés et comportement de navigation : [guide des filtres](docs/catalog-filters.md).
