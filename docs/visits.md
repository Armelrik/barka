# Demandes de visite

Une demande de visite est distincte d’une réservation du bien. Elle n’accorde aucun accès payant ni droit d’achat/location et ne déclenche aucun paiement.

## Parcours

Sur une fiche publiée, un compte actif propose un jour et une heure et peut laisser un message de 1 000 caractères maximum. Après envoi, `/espace/visites` présente ses demandes, les réponses et leur état. La liste est filtrable et paginée par 20.

L’équipe ouvre `/espace/visites?view=team`. Les comptes disposant de `properties.manage` voient uniquement les demandes des biens de leur périmètre immobilier : société et descendants/auteur/commercial, SUPER_ADMIN global. Ils peuvent confirmer, refuser, annuler une visite confirmée ou la marquer effectuée après la fin du créneau. Un refus ou une annulation par l’équipe exige un motif d’au moins cinq caractères, visible du demandeur.

Le demandeur peut annuler sa propre demande en attente ou confirmée. Il ne peut jamais confirmer/refuser sa propre demande, même avec un rôle professionnel. Les auteurs, commerciaux et propriétaires ne peuvent pas demander une visite de leur propre bien. Une demande refusée ou annulée permet une nouvelle proposition ; aucun déplacement d’horaire silencieux d’une demande existante.

## Règles de cette version

- Les horaires sont saisis et affichés dans le fuseau `Africa/Ouagadougou` (UTC). Le poste du visiteur ne décale pas l’heure choisie.
- Proposition entre 30 minutes et 90 jours à l’avance. Créneau réservé d’une heure ; deux rendez-vous adjacents sont possibles.
- Une seule demande active par compte/annonce, garantie aussi par un index SQL partiel. Dix demandes actives maximum par compte ; 30 mutations par compte et par tranche de 15 minutes.
- Les demandes en attente peuvent partager un horaire. Lors de la confirmation, le serveur refuse tout chevauchement avec une visite confirmée pour le même bien, le même commercial ou le même demandeur.
- L’annonce doit toujours être publiée et non expirée, avec auteur/commercial actifs et identité vérifiée. Le demandeur doit être actif au moment de la confirmation.
- Une annonce retirée ne supprime pas l’historique. Les rendez-vous déjà confirmés restent visibles et doivent être suivis/annulés par l’équipe si nécessaire. Il n’existe pas encore d’annulation automatique lors d’une suspension ou d’une réaffectation.
- Pas d’agenda de plages d’ouverture ni de proposition automatique de créneaux libres : le client propose, l’équipe décide. Ces règles de durée/délai sont les valeurs de cette première version, à ajuster au fonctionnement métier.

## Confidentialité et concurrence

Les API exigent une session active, contrôlent l’origine des écritures et imposent `expectedUpdatedAt` pour les décisions. L’acteur, son statut et ses droits sont relus dans la transaction. Une demande hors périmètre renvoie 404 ; aucune coordonnée téléphonique/email, pièce, clé de stockage ou détail d’un rendez-vous concurrent n’est révélé dans les réponses.

Les confirmations et écritures utilisent le verrou transactionnel existant partagé avec la gestion des identités et des annonces. Le conflit est vérifié après acquisition du verrou : deux confirmations simultanées incompatibles ne peuvent pas toutes réussir. Cela privilégie la cohérence à cette échelle ; prévoir une stratégie de verrous plus fine et des tests de charge PostgreSQL native avant montée en volume.

Chaque création/changement d’état produit un audit transactionnel sans recopier les messages dans les métadonnées d’audit. Les messages et réponses restent sur la demande et sont rendus comme du texte. Réponses privées sans cache partagé.

## Démonstration et exploitation

Sur les biens fictifs en mode demo, le même formulaire simule une demande dans la mémoire du navigateur. Le libellé annonce la simulation, aucune requête de création ni rendez-vous persistant n’est envoyé. `/visites/demo` reste la démonstration de navigation immersive, indépendante d’une demande de rendez-vous.

En mode database, appliquer la migration `202611090005_visits` avec les migrations précédentes avant d’utiliser le parcours. La migration ajoute les champs message/réponse et les index. Si des doublons actifs préexistent dans `VisitRequest`, l’index unique refusera la migration ; les examiner avant déploiement, sans suppression automatique.

Aucun SMS, email ou rappel n’est envoyé. Les réponses se consultent dans l’espace personnel. Notifications, agenda de disponibilités, réservations et paiements restent des étapes séparées. La base de travail et `.env` ne sont pas modifiées par les vérifications sur la base isolée.

## API

- `GET /api/v1/visits?view=mine|team&status=...&page=1` : liste privée.
- `POST /api/v1/visits` : `{ slug, desiredAt, message? }`, date ISO avec fuseau.
- `PATCH /api/v1/visits/:id` : `{ action, expectedUpdatedAt, reply? }`, actions `CONFIRM`, `REJECT`, `CANCEL`, `COMPLETE`.
