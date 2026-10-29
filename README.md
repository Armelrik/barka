# BARKA SARL

Plateforme immobilière et foncière — phase 1. Next.js App Router, React, TypeScript strict, Tailwind, composants compatibles shadcn/ui, Lucide, PostgreSQL/Prisma. Aucun Laravel.

Reprise sur un autre poste : [guide Mac](docs/mac-handoff.md). Référence de la future visualisation immersive : [visionneuse des biens](docs/property-viewer.md).

## Démarrer l'interface

Node.js >= 22.12 (Node 24 LTS conseillé), npm. Sous PowerShell avec scripts désactivés, utiliser `npm.cmd` et `npx.cmd`.

```sh
npm ci
cp .env.example .env
npm run dev
```

Ouvrir http://localhost:3000. L'accueil et les fiches fictives fonctionnent sans PostgreSQL et sans secret. Aucune donnée utilisateur réelle à utiliser à cette étape. Les liens de recherche fonctionnent sur un jeu de démonstration local.

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

Contrôle reproductible sur une base locale de test dédiée, migrations appliquées : définir `TEST_DATABASE_URL`, puis lancer `npm run test:db`. Ce contrôle relance le seed deux fois avec des mots de passe distincts et vérifie les comptes, les hash inchangés, les prix, les paramètres, la hiérarchie et les identifiants des démarcheurs. Il ajoute uniquement des données de démonstration et refuse une base distante.

Le seed transactionnel utilise des upserts et un verrou d'exécution ; un second passage ne duplique pas les données et ne réinitialise pas les mots de passe, prix ou paramètres existants. Comptes `super_admin@barka.example`, `admin@barka.example`, `supervisor@barka.example`, `manager@barka.example`, `commercial@barka.example`, `default_commercial@barka.example`, `client@barka.example`. Identifiants fictifs, téléphones de test non utilisables. Pas encore de formulaire de connexion. Ne pas déployer ces comptes en production ; le seed refuse `NODE_ENV=production`. Aucun paiement, document d'identité ni média tiers créé.

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

- Accueil français responsive inspiré de la référence fournie : hero photographique, Poppins auto-hébergée, palette bleu nuit/or, galerie de quatre exemples avec visuels d’ambiance générés par IA, recherche combinée et fiches.
- Favoris de démonstration conservés dans ce navigateur, filtre des favoris et menu mobile accessible. Les favoris associés à un compte restent à intégrer avec l'authentification.
- Schéma Prisma initial, migration et seed avec hiérarchie, localités de démonstration, tarifs et paramètres. Numérotation annuelle atomique des démarcheurs.
- Politique RBAC pure testée ; aucun endpoint privé n'est exposé.
- Vérification d'intégration du seed : [scripts/verify-demo-seed.ts](scripts/verify-demo-seed.ts).
- Documentation : [exigences](docs/requirements.md), [architecture](docs/architecture.md), [RBAC](docs/rbac-matrix.md), [modèle de données](docs/data-model.md), [feuille de route](docs/roadmap.md).

À implémenter : authentification et autorisations intégrées, CRUD/administration, vrai catalogue, médias S3 et 360°, demandes/réservations, abonnements, mock puis paiements réels, notifications, textes légaux validés. Les modèles ne constituent pas une implémentation de ces modules. Pas de panorama sans média autorisé. L'aperçu est `noindex` jusqu'au lancement.

## Hébergement

Compatible avec une cible Next.js Node sur Vercel ou VPS Node/Docker. PostgreSQL managé avec pool, stockage objet séparé, HTTPS, worker externe pour tâches et miniatures. Pas de simple hébergement PHP. Définir les variables d'environnement via le gestionnaire de secrets de l'hébergeur ; ne jamais préfixer les secrets par `NEXT_PUBLIC_`. Coûts et sauvegardes : voir [architecture](docs/architecture.md).

## Vérifications de cette livraison

Le résultat des commandes exécutées et les limites de l'environnement sont consignés dans `docs/verification.md` à la fin de la phase 1.

La refonte graphique, la provenance des visuels et les prompts sont documentés dans [docs/design.md](docs/design.md). Les assets de `public/design` sont des ressources graphiques statiques ; les médias des futurs biens publiés utiliseront le stockage objet prévu.
