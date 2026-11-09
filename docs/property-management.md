# Biens, médias, modération, visites et carte

La charte Afriloc est conservée. Cette étape ajoute la gestion des dossiers immobiliers et deux modes de catalogue : `CATALOG_MODE=demo` (par défaut, sans base, huit exemples fictifs) et `CATALOG_MODE=database` (annonces réellement publiées, filtres et pagination serveur). Il n’y a pas de mélange automatique entre les deux sources si la base est indisponible.

## Dossiers et droits

`/espace/biens` liste les dossiers autorisés. `/espace/biens/nouveau` crée un bien et son annonce en brouillon. `/espace/biens/:id` permet de modifier description, type, vente/location, prix XOF entier, surface, pièces, garage, société à la création, localité, commercial et note foncière interne. Société immuable après création ; commercial actif de la société et du périmètre ; localité du pays de la société. Les coordonnées sont facultatives et doivent être fournies ensemble.

La permission `properties.manage` est requise. Hors SUPER_ADMIN, le périmètre est limité à la société et aux commerciaux/auteurs de l’équipe descendante, soi-même inclus. Le serveur relit acteur et droits dans la transaction. Les écritures prennent le même verrou global que la gestion des utilisateurs. Les modifications de formulaire et de visite exigent `expectedUpdatedAt`. Les modifications de contenu, médias ou visite retirent la publication et repassent en DRAFT : aucun contenu nouveau ne devient public sans nouvelle validation.

## Validation et publication

DRAFT → SUBMITTED → VERIFYING → APPROVED → PUBLISHED. Rejet vers DRAFT ; suspension depuis PUBLISHED ; archivage possible des états non archivés. Un modérateur doit avoir `listings.moderate` et être indépendant de l’auteur, du commercial et des propriétaires du bien. Les motifs de rejet/suspension sont obligatoires. Les décisions et changements sont audités dans la transaction.

Avant approbation/publication : commercial actif, AgentProfile VERIFIED avec pièce d’identité READY, au moins une photographie et un document foncier READY. La validation juridique est humaine ; une image déposée ne constitue pas une preuve foncière automatique. `listing.revalidationDays` détermine l’expiration, 14 jours par défaut. Les requêtes publiques excluent immédiatement annonces expirées, suspendues, brouillons et agents inactifs/non vérifiés, sans attendre un cron.

## Médias privés

Images JPEG/PNG/WebP, non animées, 16 Mo et 32 mégapixels maximum. Les octets sont décodés puis réencodés en JPEG via Sharp, métadonnées supprimées. Un panorama exige un ratio exact 2:1, largeur 2048–8192 pixels. Le modèle 3D est un GLB 2.0 autonome de 32 Mo maximum : signature, taille, JSON, ressources intégrées, textures raster et complexité vérifiés ; ressources externes et décodeurs obligatoires non pris en charge refusés. GLTF avec fichiers annexes, SVG importés, PDF et vidéo ne sont pas acceptés dans cette étape. Les documents fonciers et identités sont des images privées.

Production : `MEDIA_DRIVER=s3`, bucket privé, variables `S3_*` ou rôle IAM pour AWS. Le serveur dépose/lit les objets et ne communique aucune clé S3 au navigateur. Le dépôt est actuellement relayé par Node ; adapter aux limites de corps HTTP de l’hébergeur et passer aux dépôts signés/traitement worker avant gros volumes. Pas d’intégration antivirus généraliste revendiquée : les contrôles actuels sont le décodage/réencodage d’images et la validation structurelle des GLB. Durcir la chaîne de scan/quarantaine et la charge avant collecte réelle à grande échelle.

Développement/test : `MEDIA_DRIVER=local`, fichiers privés dans `.barka-media/`, ignorés par Git et hors `public`. En production, ce mode exige `MEDIA_LOCAL_PREVIEW=true` et une origine d’authentification loopback ; il est réservé à l’aperçu local, pas à un hébergement public. Les fichiers de démonstration sous `public/immersive-demo` sont des créations procédurales statiques, pas des téléversements utilisateurs.

`GET /api/v1/media/:id` vérifie les droits à chaque lecture. Les images/panoramas/modèles/plans d’une annonce publiée peuvent être servis publiquement ; les documents fonciers et identités ne le sont jamais. Documents fonciers : périmètre immobilier requis. Identité : propriétaire ou permission dédiée `identity.review` et périmètre de l’équipe. Les consultations sensibles sont journalisées ; réponses sans cache partagé. Une suppression retire l’accès immédiatement et crée un job persistant MEDIA_DELETE. Exécuter `npm run media:cleanup` dans un worker/planificateur séparé pour supprimer les objets non référencés, avec retries. Prévoir sauvegarde et conservation décidées avec le métier.

## Vérification des démarcheurs

`/espace/verification` permet au démarcheur de soumettre sa pièce et aux ADMIN/SUPER_ADMIN autorisés d’examiner les dossiers en attente (maximum 50 affichés). Migration et seed accordent `identity.review` uniquement à ces rôles. L’auteur ne peut pas approuver sa propre identité. Les nouvelles pièces passent PENDING ; remplacer une pièce vérifiée suspend les annonces publiées/approuvées et retire l’accès à l’ancienne pièce. Les décisions requièrent un compte rendu. En production, la collecte d’identité reste bloquée tant que `LEGAL_DOCUMENTS_APPROVED` n’est pas activé après validation des textes et de la conservation. Aucune identité réelle n’est créée par les tests.

## Visites immersives

`/espace/biens/:id` comporte un éditeur : panoramas, titres de pièces, angles initiaux, points d’information/navigation, positions relatives sur un plan facultatif, modèle GLB. Les médias doivent appartenir au même bien et être READY ; les destinations doivent appartenir à la même visite. Les changements sont atomiques et imposent une nouvelle validation. `/espace/biens/:id/visite` prévisualise le dossier privé ; `/visites/:slug` n’expose que la visite d’une annonce publiée valide.

Le rendu Three.js est chargé côté navigateur à la demande : sphère texturée pour les panoramas, GLTFLoader/OrbitControls pour les modèles. Souris, tactile, clavier, zoom, navigation entre scènes, lecture guidée volontaire, vignettes, mini-plan et plein écran avec sortie. Aucun bouton 3D sans modèle disponible. Les ressources GPU/écouteurs sont libérés lors du changement de média. Un message explicite remplace le rendu si WebGL 2 ou le média manque.

`/visites/demo` fonctionne sans base : deux véritables images equirectangulaires calculées et un GLB schématique original. Tous sont fictifs. `npm run demo:immersive` régénère les ressources depuis la géométrie de `scripts/generate-tour-demo.mjs`. Il ne s’agit ni d’une photographie réelle, ni d’une reconstruction automatique d’un bien existant.

## Carte

`/carte` et la fiche publique affichent les coordonnées arrondies à trois décimales uniquement si `showMap` a été activé dans le dossier. Le dossier privé garde les coordonnées complètes. La carte générale affiche jusqu’à 100 annonces récentes publiées avec localisation autorisée ; aucun brouillon ou document privé. Le mode demo utilise huit points fictifs. Les popups sont construits avec du texte DOM, pas du HTML fourni par les utilisateurs.

Leaflet et tuiles OpenStreetMap côté navigateur, attribution visible, cache HTTP du navigateur et sans préchargement massif. Le fond est configurable via `NEXT_PUBLIC_MAP_TILE_URL` ; adapter l’attribution et choisir un prestataire/contrat à la montée en charge. Les appels aux tuiles transmettent les informations de connexion habituelles du navigateur au fournisseur : à intégrer dans les textes légaux définitifs. Une erreur de tuiles ne bloque pas la liste des annonces.

## Routes principales

- `/api/v1/properties` : GET liste privée, POST création.
- `/api/v1/properties/:id` : GET détail, PATCH modification.
- `/api/v1/properties/:id/actions` : POST décision de publication.
- `/api/v1/properties/:id/media` : POST dépôt, DELETE retrait.
- `/api/v1/properties/:id/tour` : PUT remplacement validé de la visite.
- `/api/v1/identity` : POST pièce d’identité ; `/api/v1/identity/:userId` : PATCH décision.
- `/api/v1/catalog` : GET catalogue public filtré/paginé en mode database.

Les demandes de visite et leur suivi sont décrits dans [visits.md](visits.md). Favoris associés au compte, réservations du bien, contacts payants, paiements, commissions, vidéos, Matterport, import de référentiels et notifications automatiques restent à développer. Les modèles de données correspondants ne sont pas présentés comme des services livrés.

Références d’implémentation : [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html), [AWS SDK S3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html), [Leaflet 1.9.4](https://leafletjs.com/reference-1.9.4.html), [politique des tuiles OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).
