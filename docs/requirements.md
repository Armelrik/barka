# BARKA SARL — exigences et périmètre

## Objectif

Plateforme immobilière et foncière au Burkina Faso, extensible par pays et société. Français, XOF entier, téléphones normalisés E.164 (+226 au Burkina Faso). Next.js full-stack uniquement ; aucun Laravel.

## Phase 1 livrée

Architecture, matrice RBAC, schéma relationnel initial, migration SQL, seed de démonstration idempotent, structure Next.js stricte, composants UI, accueil responsive et catalogue de démonstration filtrable. Les exemples sont fictifs. Aucun compte, paiement, document légal ou média panoramique réel n'est présenté comme vérifié.

## Exigences transversales

- Catalogue gratuit ; contact protégé et services payants contrôlés au serveur après paiement confirmé.
- Inscription gratuite : nom réel et téléphone obligatoires, email facultatif. Connexion téléphone ou email. Consentements versionnés. Naissance non collectée par défaut.
- Rôle hiérarchique distinct des profils OWNER / AGENT / AGENCY. Autorisation serveur fondée sur permission, société, pays, arbre de rattachement et propriétaire de ressource.
- CNIB/passeport privés avant première publication d'un démarcheur non vérifié. Collecte, conservation, suppression et accès à formaliser avant activation.
- Publications : DRAFT → SUBMITTED → VERIFYING → APPROVED → PUBLISHED, puis SUSPENDED / EXPIRED / ARCHIVED. Revalidation par défaut à 14 jours, réglable, rappels et historique.
- Parcelles et constructions : localisation hiérarchique, références foncières, propriétaires et copropriétaires, titres et documents, équipements, unités/pièces, surfaces, occupation et location.
- Dossiers fonciers : vente, achat, prêt, gage, bail, hypothèque, legs ; instruction humaine, aucune exécution juridique automatique.
- Demandes de visite, achat/location et réservations : disponibilité transactionnelle, historique et divulgation limitée des contacts.
- Visites : panoramas equirectangulaires par pièce, hotspots, plan optionnel, plein écran ; GLB/GLTF et Matterport en extension. Aucune promesse de reconstruction 3D depuis de simples photos.
- Médias en stockage objet privé, validation MIME/taille, quarantaine, miniatures via worker, CDN et URLs signées ; jamais de fichiers binaires en base ou dans public/.
- Abonnements, tarifs administrables, reçus, commissions, journal financier et rapprochement. Pas de carte bancaire complète stockée.
- Notifications email/SMS/WhatsApp/appel : consentement, file persistante, retries et prestataires à sélectionner. USSD/mobile : interfaces futures uniquement.
- Administration : utilisateurs, hiérarchies, sociétés, agences, biens, annonces, visites, demandes, prix, abonnements, finances, campagnes, audits et paramètres.

## Données initiales configurables

Manager : 5 000 XOF/an ; commercial/démarcheur/agence : 5 000 XOF/an ; client : 100 XOF/jour de service payant ; révélation d'un contact : 100 XOF. Catalogue gratuit. Tarifs d'alertes à configurer avant activation, sans valeur supposée.

## Hors phase 1

Authentification exposée au public, CRUD, stockage réel, modération opérationnelle, réservation, intégrations et encaissements. La présence des modèles ne signifie pas que ces fonctions sont livrées.

## Points à préciser avant MVP

Identité légale complète de la société et textes validés ; règles de divulgation et d'accès journalier ; prestataires et contrats ; moyens de preuve foncière ; politique de conservation ; référentiel administratif à jour ; règles de commissions et traitement des litiges. Les localités du seed sont des exemples, pas un référentiel officiel.
