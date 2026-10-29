# Reprendre BARKA sur Mac

## Installation

Prérequis : Git et Node.js 24 avec npm. `.nvmrc` fixe la version majeure 24 ; avec nvm déjà installé, utiliser `nvm install` puis `nvm use` dans le dossier du projet.

```sh
git clone https://github.com/Armelrik/barka.git barka
cd barka
npm ci
npm run setup:local
npm run dev
```

Ouvrir http://localhost:3000. La génération Prisma est effectuée par `postinstall`. L'accueil, les filtres, les fiches et les favoris locaux fonctionnent sans démarrer PostgreSQL. Poppins et les quatre visuels d'ambiance sont inclus dans le dépôt.

## Base locale facultative pour le travail sur le socle

Avec Docker/Compose disponible :

```sh
docker compose up -d
npm run db:deploy
# Définir DEMO_PASSWORD dans .env : au moins 12 caractères, au plus 72 octets.
npm run db:seed
```

Le mot de passe est local à cette installation. Aucun fichier `.env`, base de données, compte actif Windows ou secret n'est transféré par Git. Le seed contient uniquement des exemples fictifs et ne réinitialise pas les mots de passe existants.

Pour vérifier deux exécutions successives du seed sur une base locale de test dédiée avec les migrations appliquées :

```sh
TEST_DATABASE_URL='postgresql://barka:barka_local_only@localhost:5432/barka?schema=public' npm run test:db
```

## Vérification sur Mac

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Les E2E démarrent un serveur de production sur le port 3001 ; ce port doit être libre. Les vérifications précédentes ont réussi sous Windows : 14 tests unitaires, 6 parcours navigateur, compilation, lint et typecheck. Les migrations et seeds ont été vérifiés avec Prisma/PGlite local ; il reste à confirmer l'exécution sur PostgreSQL natif, notamment avec le Compose fourni.

## État et suite

Livré : cadrage phase 1, schéma et migrations, seed idempotent, accueil refondu, Poppins locale, recherche et favoris de démonstration ; inscription CLIENT, connexion téléphone/email, sessions révocables, espace personnel et annuaire d'équipe protégé en lecture seule. Voir [authentication.md](authentication.md) pour la configuration locale et les tests.

Nouvelle direction de visualisation : [property-viewer.md](property-viewer.md) décrit la seconde référence fournie par l'utilisateur (vue immersive, hotspots violets, pièces à droite, vignettes et mini-plan). Sa réalisation reste à développer avec les médias adaptés. Préserver cette direction graphique pendant la suite.

Ordre de travail du socle : compléter les opérations administratives sur les utilisateurs et rattachements, puis CRUD/modération/stockage objet et catalogue connecté. La visionneuse peut être préparée au niveau présentation, sans annoncer une vraie 360° à partir des photos d'ambiance. Réservations et paiements suivent la validation du socle. Les comptes fictifs se connectent avec DEMO_PASSWORD de votre .env ; pour actualiser leur mot de passe local existant, utiliser `npm run db:demo-password`. Voir [roadmap.md](roadmap.md) et [verification.md](verification.md).
