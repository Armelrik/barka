# Publicités et audience

## Gestion

Le rôle **SUPER_ADMIN** accède à `/espace/publicites` et `/espace/statistiques`. Ces écrans et leurs API refusent les autres rôles, y compris ADMIN. Une campagne peut être créée, modifiée, programmée ou mise en pause. Les modifications sont journalisées et une version concurrente est refusée plutôt qu’écrasée.

Trois emplacements existent sur l’accueil : `HERO` à droite du titre, `AFTER_HERO` sous le hero, `BEFORE_FOOTER` avant le pied de page. Le carrousel tourne toutes les sept secondes, avec navigation manuelle et pause. Il s’arrête au survol, au focus, quand l’onglet est masqué et selon la préférence de réduction des animations. La lecture reste déclenchable manuellement. L’affichage s’adapte au mobile.

Choisir le titre, la description, l’annonceur, la nature (autopromotion Barka ou publicité sponsorisée), le lien, le visuel, les dates en heure du Burkina Faso (UTC), la priorité et l’activation. Une priorité supérieure affiche la campagne plus tôt dans la rotation. Vingt campagnes peuvent se chevaucher par emplacement. Seules les campagnes actives dans leur période apparaissent ; la date de fin les retire automatiquement. Sans campagne, l’espace propose un contact commercial.

Les images peuvent provenir de la bibliothèque ou être importées : photographies JPG/PNG/WebP prises en charge par le traitement existant, maximum 4 Mo et minimum 320 × 180 pixels. Elles sont normalisées en JPEG sans métadonnées puis stockées dans le stockage privé ; seuls les visuels associés à une campagne active sont accessibles publiquement. Le superadministrateur peut prévisualiser les visuels non diffusés. Les destinations acceptées sont des chemins internes ou des adresses HTTPS sans identifiants intégrés.

## Rapports

La période est réglable jusqu’à 90 jours, en jours UTC. Le rapport comprend pages vues, sessions quotidiennes cumulées, connexions réussies, affichages, clics et taux de clic par campagne. Exports CSV UTF-8 compatibles tableur et impression/enregistrement PDF via le navigateur. Les exports ne contiennent pas de liste nominative des comptes.

- Pages vues : navigations publiques mesurées par JavaScript, hors parcours privés. Les fiches sont regroupées sous `/biens/[slug]` et `/visites/[slug]` ; les recherches et paramètres ne sont pas transmis.
- Sessions : identifiant aléatoire dans sessionStorage, renouvelé après 30 minutes d’inactivité et pseudonymisé quotidiennement au serveur. Le cumul quotidien n’est pas un nombre de personnes uniques sur la période.
- Affichages publicitaires : au moins 50 % du visuel visible pendant une seconde, ou un clic. Une campagne est comptée une seule fois par page et session ; le clic entraîne aussi l’affichage s’il n’avait pas encore été mesuré.
- Connexions : événements réussis issus du journal de sécurité, distinguant clients, équipe et comptes BARKA-DEMO pour les nouveaux événements. Les événements historiques sans rôle sont signalés séparément.
- Taux de clic : clics divisés par affichages, en pourcentage ; absence de dénominateur indiquée par un tiret.

Les mesures publiques natives excluent les comptes d’équipe connectés, les comptes BARKA-DEMO, les robots reconnus et les navigateurs automatisés. Elles respectent DNT, GPC et le réglage dans `/confidentialite`. Elles ne sont collectées qu’en mode `database` et sur Production si hébergées par Vercel. Aucun historique artificiel n’est ajouté. Les bloqueurs et les limites de reconnaissance peuvent affecter ces estimations. Les événements d’audience ne stockent pas d’adresse IP brute ; le limiteur de requêtes utilise une empreinte distincte.

## Vercel Web Analytics

`@vercel/analytics` est installé et `Analytics` est importé depuis `@vercel/analytics/next` dans le composant global `SiteAnalytics`. Les parcours privés sont exclus via `beforeSend`, les paramètres et fragments sont retirés, les fiches sont regroupées. Le choix de confidentialité s’applique aussi à cette intégration. Les chiffres Vercel et Barka restent deux mesures distinctes ; le rapport Barka ne prétend pas importer le tableau de bord Vercel.

L’état du projet Vercel consulté pendant cette intervention indique Web Analytics déjà activé. Le chargement du script sur la nouvelle version reste à vérifier après déploiement. Tableau Vercel : https://vercel.com/armelriks-projects/barka/analytics.

## Mise en service et vérifications restantes

La migration additive `202611100011_advertising_audience` crée `AudienceEvent`, `AdCreative` et complète `Advertisement`. Elle a été appliquée sur la base locale de test. Elle n’a **pas encore été appliquée sur Neon** pour cette intervention ; aucun déploiement de ces fonctionnalités n’a été effectué.

Le script `db:house-ads` prépare quatre campagnes internes (deux dans le hero, une par bandeau). Ce sont des autopromotions Barka, pas des annonceurs payants inventés. Il vérifie le compte initial SUPER_ADMIN et le marqueur de bootstrap, crée uniquement les identifiants manquants et conserve les campagnes déjà modifiées. Il n’ajoute ni biens, ni comptes, ni événements d’audience. Dates initiales : lancement à l’exécution, durée 90 jours.

Après rétablissement des permissions d’exécution, terminer la compilation et les tests avant la mise en ligne. Commandes depuis un terminal disposant des accès requis :

```sh
npm run build
npm run lint
npm run typecheck
npm test
# Base locale isolée déjà migrée, à démarrer si nécessaire :
npx prisma dev start barka-backoffice-tests-20261110
TEST_DATABASE_URL='postgres://postgres:postgres@localhost:51230/template1?sslmode=disable' npm run test:auth -- advertising
CATALOG_MODE=demo npm run test:e2e -- home.spec.ts
```

Puis, après réussite des contrôles, charger les variables privées de Production sans les copier dans le chat :

```sh
node --env-file=.env.vercel node_modules/prisma/build/index.js migrate deploy
node --env-file=.env.vercel --conditions=react-server --import tsx scripts/seed-house-ads.ts
node --env-file=.env.vercel --conditions=react-server --import tsx scripts/seed-house-ads.ts --apply
vercel deploy --prod --yes --scope armelriks-projects
```

Contrôler ensuite les trois emplacements sur ordinateur et mobile, le changement manuel de publicité, les dates, l’export depuis un compte superadministrateur et le script Vercel. Ne pas utiliser les comptes réels dans un contrôle automatisé public. Les tests automatisés n’alimentent pas les compteurs visiteurs.

## Emplacements complémentaires proposés

1. Dans le catalogue, après six cartes, sous forme de carte explicitement sponsorisée, sans modifier le classement des biens.
2. Dans une fiche, après les caractéristiques : financement, assurance, déménagement ou services domestiques pertinents.
3. Sous la liste des résultats de la carte, sans recouvrir la carte ni les marqueurs.

Ces emplacements sont des propositions ; seuls les trois emplacements d’accueil sont implémentés dans cette étape.
