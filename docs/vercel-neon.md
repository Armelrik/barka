# Déploiement Barka sur Vercel avec Neon

Le dépôt est préparé pour Next.js sur Vercel et PostgreSQL Neon. L’initialisation de production ne lance jamais le seed de démonstration. Elle crée un superadministrateur et un compte d’accueil `DEFAULT_COMMERCIAL`, puis l’équipe est créée depuis l’espace de gestion.

## État des accès

La connexion Neon Barka a été enregistrée dans le `.env` privé le 9 novembre 2026 : connexion mutualisée pour le site et directe pour les migrations. Les six migrations sont appliquées et vérifiées. Les sept comptes de démonstration préexistants sont conservés actifs à la demande de l’utilisateur ; les deux comptes initiaux de la société BARKA sont créés et leur connexion administrateur a été vérifiée sur le serveur local. Le mot de passe de connexion communiqué dans le chat doit être renouvelé dans Neon, puis remplacé dans les variables privées locales et Vercel. Aucun secret n’est conservé dans la documentation ou Git.

## 1. Connecter la base existante

Depuis le projet **Barka** de Neon, choisir la branche et la base voulues :

- `DATABASE_URL` : connexion avec pool (`-pooler` dans le nom d’hôte), pour les fonctions du site.
- `DIRECT_URL` : connexion directe, à la **même branche, même base et même rôle**, pour Prisma Migrate, l’inspection et l’initialisation.
- Conserver les paramètres TLS fournis par Neon, notamment `sslmode=require`. Aucun contournement de validation TLS n’est ajouté dans le code.

Les valeurs vont dans le `.env` privé local et, séparément, dans les variables Vercel. Ne pas utiliser une base Production pour les déploiements Preview ; attribuer une branche Neon de test distincte.

```sh
npm ci
npm run db:inspect
```

L’inspection est en lecture seule : tables, migrations et nombres de comptes par rôle, sans mot de passe, email ni URL de connexion. L’utilisateur a demandé de conserver les sept comptes de seed pour le moment : aucun retrait ne doit être exécuté sans nouvelle autorisation. L’initialisation ne les transforme pas en comptes réels. Si la base contient un ancien schéma sans historique Prisma, préparer une baseline/import adapté après examen. Ne pas utiliser `db push`, `migrate reset` ni marquer des migrations déjà appliquées sans comparer le schéma.

## 2. Appliquer les migrations

Après vérification de la base cible et de sa restauration disponible :

```sh
npm run db:status
npm run db:deploy
npm run db:inspect
```

Six migrations sont versionnées : schéma initial, intégrité, authentification, médias/visites immersives, demandes de visite, puis rôles et permissions de production. La sixième ajoute les références RBAC sur une base vierge ; elle ne crée aucun compte, annonce ni tarif fictif. Les rôles/permissions existants sont conservés, avec ajout des droits standard manquants.

La migration des demandes de visite impose une seule demande active par compte/annonce. Des doublons existants doivent être examinés avant la migration ; aucune suppression automatique n’est effectuée.

## 3. Créer les comptes initiaux

Le fichier privé `.env.bootstrap` est ignoré par Git et créé avec des permissions restreintes. Un mot de passe administrateur aléatoire y a été généré localement ; il peut être remplacé avant la première exécution. Compléter dans l’éditeur :

- nom et prénom de l’administrateur ;
- son téléphone et son email facultatif ;
- un **autre téléphone** pour le compte d’accueil ;
- `BARKA_COMPANY_CODE=BARKA` et le nom de la société.

Le modèle sans secrets est [.env.bootstrap.example](../.env.bootstrap.example).

```sh
npm run db:bootstrap
```

La commande utilise `DIRECT_URL`, puis `DATABASE_URL` à défaut. Elle crée la société, les deux comptes, leur rattachement, le profil et l’identifiant du commercial par défaut, les villes Ouagadougou/Bobo-Dioulasso et le délai de revalidation des annonces. Les référentiels géographiques détaillés restent à importer depuis une source validée ; aucune région/province fictive n’est créée.

Le compte d’accueil possède un secret aléatoire non affiché et n’est pas un compte de connexion partagé. Il sert de parent aux inscriptions CLIENT. Son profil reste non vérifié : il ne publie pas automatiquement des biens. Le superadministrateur crée les membres de l’équipe avec leurs identifiants individuels.

La relance conserve les mots de passe et n’ajoute pas de comptes. Une collision d’identifiants, une société déjà occupée sans marqueur d’initialisation, ou un compte initial modifié de manière incompatible provoque un refus atomique. La commande ne promeut jamais un utilisateur existant et ne réinitialise jamais son mot de passe. Aucun consentement fictif n’est ajouté aux comptes provisionnés.

Conserver les identifiants dans le gestionnaire de mots de passe, puis retirer le fichier bootstrap du poste partagé. Ne pas ajouter `BOOTSTRAP_*` ni `DEMO_PASSWORD` dans Vercel.

## Retirer les comptes fictifs

Après contrôle de la connexion de l’administrateur réel, `npm run db:retire-demo` simule le retrait des sept comptes du seed. La commande exige une correspondance exacte société/email/rôle/téléphone et vérifie les deux comptes initiaux de production. Toute modification des identifiants de seed impose un examen manuel. Après autorisation explicite, `npm run db:retire-demo -- --apply` suspend les comptes encore actifs, révoque leurs sessions et journalise les changements, sans supprimer de compte ni de bien. Une relance conserve les statuts déjà suspendus/clos et ne duplique pas les audits sans changement.

## 4. Configurer Vercel

Importer le dépôt GitHub `Armelrik/barka` après avoir poussé les modifications à déployer. Framework **Next.js**, Node.js **24.x**, racine du dépôt. `vercel.json` définit `npm run build:vercel` comme commande de build ; `postinstall` et `build` génèrent le client Prisma.

Le modèle [.env.vercel.example](../.env.vercel.example) énumère les variables. Le fichier local privé `.env.vercel` a été préparé avec les connexions Neon et un secret de session distinct ; il est exclu de Git et des envois CLI Vercel. Le stockage Neon est maintenant renseigné et vérifié ; il reste à y renseigner l’origine du projet Vercel. Ajouter les vraies valeurs dans **Settings → Environment Variables**, dans le bon environnement :

| Groupe    | Configuration                                                                                                                                               |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base      | `DATABASE_URL`, `DIRECT_URL`, `DATABASE_POOL_MAX=2`                                                                                                         |
| Sessions  | `AUTH_SECRET` aléatoire d’au moins 32 caractères, `AUTH_URL=https://votre-domaine`                                                                          |
| Société   | `BARKA_COMPANY_CODE=BARKA`                                                                                                                                  |
| Catalogue | `CATALOG_MODE=database` pour les annonces réelles ; `demo` pour les exemples fictifs                                                                        |
| Comptes   | `REGISTRATION_ENABLED=false` tant que l’ouverture n’est pas décidée ; `LEGAL_DOCUMENTS_APPROVED=false` tant que les textes/conservation ne sont pas validés |
| Stockage  | `MEDIA_DRIVER=s3`, bucket **privé**, région, clés S3 et endpoint si fournisseur compatible                                                                  |
| Médias    | `NEXT_PUBLIC_MEDIA_MAX_MB=4`, `MEDIA_LOCAL_PREVIEW=false`                                                                                                   |
| Proxy     | `AUTH_TRUST_PROXY_HEADERS=false` tant que les en-têtes ingress ne sont pas vérifiés                                                                         |

`AUTH_SECRET` et les clés ne doivent jamais être préfixés par `NEXT_PUBLIC_`. Pour générer un secret, utiliser un gestionnaire de mots de passe et le renseigner directement dans Vercel.

Sur Preview, ne pas recopier l’origine Production : sans `AUTH_URL`, le serveur utilise la variable de déploiement `VERCEL_URL` fournie par Vercel et impose HTTPS. Aucun en-tête Host transmis par le navigateur ne détermine l’origine autorisée. Utiliser l’URL exacte du déploiement pour les mutations.

`npm run deploy:check` vérifie les variables sans leurs valeurs. Ce contrôle ne prouve pas la connectivité Neon, les autorisations du bucket ou sa confidentialité : tester ces accès séparément.

Par défaut, le build ne modifie pas la base. Après validation de la cible, `RUN_DATABASE_MIGRATIONS=true` active `prisma migrate deploy` avant le build, **uniquement lorsque `VERCEL_ENV=production`**. Le même réglage sur Preview est refusé. Aucun bootstrap ni seed n’est exécuté au build. Les migrations déjà appliquées ne sont pas annulées si un build ultérieur échoue.

## Stockage du projet Neon Barka

Le stockage retenu est **Neon Object Storage** du projet Barka. Le bucket actif de l’application est **barka-uploads**, vérifié privé par un test réel : dépôt/relecture authentifiés réussis et lecture anonyme refusée (403). Le bucket `barka-media` autorise les lectures anonymes ; il n’est donc pas utilisé pour les médias et pièces servis par Barka. Aucun accès de bucket existant n’a été modifié. L’adaptateur S3 de Barka utilise déjà le SDK compatible et l’adressage par chemin requis par Neon. Aucun abonnement à un autre stockage n’est nécessaire pour cette intégration.

Renseigner dans `.env.vercel` privé les paramètres Storage du projet :

| Paramètre Barka        | Valeur à récupérer dans Neon                       |
| ---------------------- | -------------------------------------------------- |
| `MEDIA_DRIVER`         | `s3`                                               |
| `S3_ENDPOINT`          | Endpoint S3 de la branche (`AWS_ENDPOINT_URL_S3`)  |
| `S3_REGION`            | Région fournie pour Object Storage (`AWS_REGION`)  |
| `S3_BUCKET`            | Nom du bucket choisi, configuré privé dans Neon    |
| `S3_ACCESS_KEY_ID`     | `token_id` de la clé Storage (`AWS_ACCESS_KEY_ID`) |
| `S3_SECRET_ACCESS_KEY` | `s3_secret_access_key` (`AWS_SECRET_ACCESS_KEY`)   |

Les clés doivent permettre `storage:read`/`storage:write`. Elles sont différentes du rôle et du mot de passe PostgreSQL ; la chaîne `DATABASE_URL` ne permet pas de les déduire. La confidentialité du bucket se règle dans Neon, pas avec une écriture ACL S3.

`npm run storage:check` vérifie l’accès au bucket. Avec `-- --probe`, la commande dépose une image d’illustration sous une clé aléatoire via le connecteur réel de Barka, compare sa relecture, vérifie le refus d’accès anonyme, puis supprime uniquement ce fichier de test. Les paramètres ne sont pas affichés. Sans clés configurées, aucun test distant n’est revendiqué.

Références : [authentification Neon Storage](https://neon.com/docs/storage/authentication), [compatibilité S3](https://neon.com/docs/storage/s3-compatibility).

## 5. Limites des médias sur Vercel

Les dépôts et lectures actuels passent par les fonctions Node. Vercel limite les corps des requêtes/réponses des fonctions à 4,5 Mo. Une limite conservatrice de **4 Mio par fichier et par média traité** est donc appliquée côté formulaire et serveur sur cet hébergement ; l’enveloppe multipart reste bornée en dessous de la limite de plateforme.

Les photos, pièces, panoramas et GLB plus lourds sont refusés avec un message explicite. Les médias volumineux déjà stockés sont également refusés après contrôle des droits. Sur un serveur Node sans cette contrainte, les plafonds initiaux 16 Mio images / 32 Mio GLB sont conservés. Un dépôt direct signé avec quarantaine/validation, puis une distribution autorisée adaptée, sera nécessaire pour les gros panoramas/GLB. Cette chaîne n’est pas revendiquée comme livrée ici.

Aucun téléversement utilisateur n’est stocké dans le système de fichiers éphémère Vercel. Le traitement `npm run media:cleanup` doit être exécuté par un worker externe avec les mêmes accès au stockage et à la base ; aucun cron public non protégé n’est ajouté.

## 6. Vérifier après déploiement

Connexion du superadministrateur, création d’un membre d’équipe, refus des accès hors rôle, puis inscription CLIENT quand les deux indicateurs d’ouverture sont explicitement activés. Vérifier le parent commercial par défaut, le cookie HTTPS et la déconnexion. Tester un dépôt S3 de moins de 4 Mio, une lecture privée, le workflow de publication et une demande de visite.

Sans annonce approuvée/publiée, le catalogue database est vide : c’est attendu. Les huit exemples du mode demo ne sont pas importés ni publiés sur la base Production. Les demandes faites sur leurs fiches restent des simulations. SMS/email, récupération de mot de passe, réservations et paiements restent hors de cette mise en ligne.

## Références

- [Prisma ORM 7 : migrate deploy](https://www.prisma.io/docs/cli/v7/migrate/deploy)
- [Prisma : connexion directe et pool](https://www.prisma.io/docs/postgres)
- [Vercel : limites des fonctions](https://vercel.com/docs/functions/limitations)
- [Vercel : versions Node.js](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Vercel : variables système](https://vercel.com/docs/environment-variables/system-environment-variables)
