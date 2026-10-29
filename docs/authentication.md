# Authentification et premier espace protégé

## Choix et périmètre livré

`iron-session` gère le scellement du cookie. Les services BARKA gèrent la validation des identifiants, le hash bcrypt, les sessions PostgreSQL, le rattachement et les autorisations métier. La solution conserve le modèle User existant et son email facultatif, sans créer un second annuaire d'utilisateurs.

Livré : inscription gratuite CLIENT, connexion téléphone/email, déconnexion, page de compte et indicateurs réels issus de la base ; annuaire d'équipe en lecture seule, filtré et paginé côté serveur. Les mutations de rôles, rattachements et statuts ne sont pas exposées dans cette livraison. Les tests modifient certains statuts directement dans leur base locale dédiée pour vérifier la révocation des droits.

## Parcours

- `/inscription` : prénom, nom, téléphone requis, email facultatif, mot de passe d'au moins 12 caractères et d'au plus 72 octets, consentements versionnés.
- `/connexion` : téléphone (8 chiffres normalisés en +226, ou numéro international) ou email normalisé en minuscules. Le format du téléphone n'atteste pas sa possession ; aucune vérification SMS n'est simulée.
- `/espace` : compte connecté uniquement, indicateurs provenant de ses demandes, abonnements et paiements. Les compteurs à zéro ne représentent pas une implémentation de la réservation ou du paiement.
- `/espace/equipe` : permission `users.manage`, descendants stricts et même société/pays ; SUPER_ADMIN peut consulter les sociétés, en excluant ses pairs et lui-même.
- `/conditions` et `/confidentialite` : documents de travail identifiés comme tels. La production reste fermée à l'inscription jusqu'à validation et remplacement des documents, mise à jour de leurs versions et activation explicite des drapeaux.

## Sessions

Token aléatoire de 256 bits, cookie chiffré/scellé HttpOnly et SameSite=Lax, Secure et préfixe `__Host-` en HTTPS. HTTP accepté uniquement pour les hôtes loopback locaux. Le cookie ne contient ni rôle, ni société, ni mot de passe. La base conserve uniquement le SHA-256 du token, la relation utilisateur et une expiration fixe de huit heures.

Chaque opération privée relit la session, son expiration, le statut du compte et les permissions en base. Un compte suspendu ou une permission retirée perd l'accès dès la requête suivante. La déconnexion supprime la session et écrit un audit dans la même transaction, puis détruit le cookie. Une ancienne copie de ce cookie est refusée après révocation. Les pages privées sont dynamiques ; les API répondent avec `Cache-Control: private, no-store`.

## Inscription et droits

Le serveur choisit le rôle CLIENT et la société via `BARKA_COMPANY_CODE`. Le navigateur ne peut pas fournir rôle, société ou parent : le schéma strict les rejette. Le commercial par défaut doit être actif, de la même société et du rôle DEFAULT_COMMERCIAL. User, ClientProfile, UserHierarchy, consentements, session et audit sont créés dans une transaction. Aucun service de publication n'est ouvert pour un compte non vérifié.

Les requêtes de liste utilisent un filtre de périmètre avant pagination (20 utilisateurs par page) et ne retournent que les champs du DTO. La hiérarchie est parcourue avec une CTE récursive bornée et protégée contre les cycles. Les demandes ciblant un utilisateur hors périmètre répondent 404. Les contrôles ne dépendent pas du masquage des boutons dans le navigateur.

## Limitation des tentatives et CSRF

Compteurs atomiques persistants dans `AuthRateLimit`, partagés entre instances Node/Vercel. Clés HMAC-SHA-256, sans téléphone, email ou IP en clair dans ces clés. Limites actuelles : 5 tentatives de connexion par identifiant sur 15 minutes, 100 par point d'entrée sur 15 minutes ; 10 inscriptions par point d'entrée sur une heure. Réponse 429 avec Retry-After. Les tentatives réussies consomment aussi le budget de connexion.

Les en-têtes de proxy sont ignorés par défaut ; le budget d'entrée est alors partagé. Activer `AUTH_TRUST_PROXY_HEADERS=true` uniquement si l'ingress est configuré pour écraser les en-têtes transmis par le client. Le déploiement doit vérifier ce contrat de confiance avant ouverture. La limite par identifiant reste appliquée, même si une IP prétendue change.

Les POST exigent un Origin autorisé et refusent Sec-Fetch-Site=cross-site. Les alias loopback localhost/127.0.0.1/IPv6 de même protocole et port sont acceptés pour le développement local ; aucune exception semblable n'est accordée à un domaine public. JSON obligatoire, lecture du flux limitée à 8 Kio. Les formulaires ont aussi une méthode POST explicite pour éviter tout envoi d'identifiants en URL avant hydratation.

## API versionnée

| Méthode / route              | Accès et résultat                                                  |
| ---------------------------- | ------------------------------------------------------------------ |
| POST `/api/v1/auth/register` | Inscription CLIENT, 201, cookie, ou validation/409/429/503         |
| POST `/api/v1/auth/login`    | Identifiant/mot de passe, 200, cookie, ou erreur générique 401/429 |
| POST `/api/v1/auth/logout`   | Origine contrôlée, suppression de la session courante              |
| GET `/api/v1/me`             | Profil du compte connecté, sans hash ni document                   |
| GET `/api/v1/users?page=1`   | Permission et périmètre, liste paginée                             |
| GET `/api/v1/users/:id`      | Permission et périmètre, 404 hors périmètre                        |

## Installation locale

```sh
npm ci
npm run setup:local
docker compose up -d
npm run db:deploy
npm run db:seed
npm run dev
```

`setup:local` crée `.env` si nécessaire et génère AUTH_SECRET et DEMO_PASSWORD sans les afficher ni écraser des valeurs déjà présentes. Si les comptes de démonstration existaient déjà avec un autre mot de passe, `npm run db:demo-password` applique explicitement DEMO_PASSWORD aux sept comptes fictifs de BARKA-DEMO et révoque leurs anciennes sessions. Cette commande refuse une base distante et le mode production ; le seed habituel ne réinitialise toujours pas les mots de passe.

Alternative PGlite utilisée sur ce poste sans Docker : lancer `npx prisma dev --name barka-auth --port 51233 --db-port 51234 --shadow-db-port 51235`, puis `npm run setup:local -- --prisma-local`. Cette option configure une seule connexion (`DATABASE_POOL_MAX=1`) ; le pont PostgreSQL de cette base locale ne doit pas être utilisé pour valider les charges concurrentes de production. Le pool des environnements PostgreSQL natifs est configurable, cinq connexions par instance par défaut.

## Tests et exploitation

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
# Base locale de test dédiée, migrations et seed déjà appliqués :
TEST_DATABASE_URL='postgresql://...@localhost:5432/barka_test' npm run test:auth
```

La suite auth utilise un secret éphémère propre au test, un serveur local sur 3002 et ses propres artefacts dans auth-test-results. Ses indicateurs d'ouverture des inscriptions sont activés exclusivement dans ce processus de test. Les fixtures créées par les tests sont supprimées par identifiant ; aucune remise à zéro générale de la base n'est exécutée. Les tests ne doivent pas viser la base de travail des utilisateurs.

Planifier le nettoyage des AuthSession expirées et des AuthRateLimit dont la fenêtre est ancienne (conserver au moins la fenêtre la plus longue avant suppression). Configurer PostgreSQL et les serveurs en UTC, HTTPS, secret géré par l'hébergeur, pool de connexions, sauvegardes et monitoring. Une rotation d'AUTH_SECRET invalide les cookies existants et les clés de limitation associées.

## Reste avant ouverture publique

Valider la configuration proxy et les charges sur PostgreSQL natif ; finaliser les textes légaux et la conservation ; choisir puis intégrer récupération de mot de passe, vérification téléphone/email et notifications. Créer le bootstrap de la société et des administrateurs de production sans comptes de démonstration. Développer les mutations d'utilisateurs avec contrôle transactionnel des cycles et des élévations, puis CRUD/modération/stockage des biens. Aucune livraison de ces fonctions n'est impliquée par les modèles ou les compteurs.

Références : [Next.js — authentification](https://nextjs.org/docs/app/guides/authentication), [iron-session](https://github.com/vvo/iron-session), [cookies App Router](https://nextjs.org/docs/app/api-reference/functions/cookies).
