# Feuille de route et acceptation

## Avancement actuel

Première étape du MVP réalisée : inscription CLIENT, connexion téléphone/email, déconnexion, sessions révocables, limitation persistante, audits et espace protégé. Annuaire d'équipe en lecture seule avec filtrage/pagination serveur. Voir [authentication.md](authentication.md). Prochaine étape : mutations d'utilisateurs et rattachements avec prévention transactionnelle des cycles, puis CRUD immobilier et modération. La vérification SMS/email, la récupération de mot de passe, les médias et les paiements restent à intégrer.

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
