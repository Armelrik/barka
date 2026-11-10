# Feuille de route et acceptation

## Avancement actuel

Authentification, sessions révocables, espace protégé et gestion d’équipe : liste filtrée/paginée, création de comptes subordonnés, modification du profil/rôle/statut, rattachements, révocation des sessions et historique. Les droits sont relus au serveur dans la transaction d’écriture ; les cycles, transferts hors périmètre et modifications obsolètes sont refusés. Voir [gestion des équipes](team-management.md).

Gestion immobilière intégrée : dossiers et offres, médias privés local/S3, vérification des démarcheurs, modération, catalogue connecté en mode database, visites 360°/GLB et carte. Voir [property-management.md](property-management.md). Demandes de visite intégrées : proposition d’horaire, suivi privé, confirmation/refus par l’équipe et conflits de créneaux. Voir [visits.md](visits.md). Favoris associés au compte, recherches enregistrées, notifications internes et agenda de disponibilités sont intégrés. La récupération et l’expédition email sont préparées pour Resend et attendent la configuration du prestataire. Prochaines étapes : réservations, abonnements puis paiements ; la vérification SMS/email reste à intégrer. Les vérifications effectivement exécutées sont consignées dans [verification.md](verification.md).

Préparation Vercel/Neon : migration de références RBAC et initialisation séparée des deux comptes de production, sans seed de démonstration. Projet Neon connecté, neuf migrations appliquées et site Vercel publié. Voir [vercel-neon.md](vercel-neon.md).

## Phase 1 — fondations (présente livraison)

Documentation, schéma/migration, seed idempotent, UI d'accueil et catalogue de démonstration, tests des filtres et limites RBAC, lint/typecheck/build. Acceptation : page française responsive, filtres utilisables, exemples signalés, aucune fausse connexion ni paiement ; schéma validé et génération du client. Migration/seed doivent être exécutés deux fois sur PostgreSQL de test avant validation de la base.

## MVP — socle opérationnel

1. Authentification maintenue, téléphone/email, inscription gratuite et consentements, sessions, rate limiting distribué, RBAC intégré et audits transactionnels. Acceptation : tests multi-sociétés, parent/enfant, pairs, escalade de rôle, cycles, accès aux documents et révocation de session. Dépend : décisions d'identité et de conservation.
2. CRUD immobilier, stockage S3 signé, vérification démarcheurs, workflow de modération et revalidation à 14 jours réglable. Catalogue connecté, pagination, SEO, favoris, comparaison, contact et pages légales validées. Acceptation : aucun brouillon/contact/document privé exposé, filtrage combiné, suppression/expiration effectives. Dépend : stockage et textes légaux.
3. Visionneuse 360° avec scènes, navigation, plein écran et chargement différé. Acceptation : souris/tactile/clavier, média autorisé, erreurs et retour fiche. Dépend : panoramas equirectangulaires autorisés ; aucune génération 3D implicite.
4. Après validation des étapes 1–3 : demandes, disponibilités, réservations, abonnements et MockPaymentProvider local uniquement. Acceptation : concurrence réservation, paiements idempotents, refus du mock en production, contact révélé seulement après confirmation serveur. Dépend : règles métier validées.

## V2 — transactions et exploitation

Intégration de prestataires de paiement selon contrats/API réellement disponibles, webhooks authentifiés, rapprochement, reçus, commissions configurables. Notifications outbox/retries, alertes payantes par canal, administration complète, annonces sponsorisées, cartes, reporting par équipe/jour. Acceptation : sandbox prestataire validée, doubles webhooks sans double droit/commission, remboursement et expiration, isolation des statistiques, restauration testée et monitoring actif.

## V3 — extension

Multi-pays, modèles GLB/GLTF, Matterport autorisé, API `/api/v1` pour apps mobiles et intégration USSD selon partenaires. Acceptation : quotas et autorisations d'API, contrats versionnés, budgets médias, accessibilité/performance contrôlées. USSD et applications mobiles ne sont pas livrés avec la V1.

## Porte de mise en production

Aucun compte seed, secrets gérés hors dépôt, revue d'autorisation/IDOR et upload, contrats de paiement, textes légaux, sauvegarde/restauration, alertes et vérification accessibilité. Les simples modèles Prisma ne valident pas les fonctionnalités. Conserver une liste de contrôles réellement exécutés dans README.

## Mise à jour du 10 novembre 2026 — parcours personnel

Favoris associés au compte, recherches enregistrées, notifications internes et agenda par plages intégrés. Récupération du mot de passe par email et file Resend préparées ; activation externe et contrôle de réception attendent un domaine validé et les accès du prestataire. Voir [account-services.md](account-services.md). Prochaines étapes : réservations, abonnements et paiements, vérification des coordonnées et rappels. Les paragraphes de phase 1 ci-dessus décrivent la livraison initiale.
