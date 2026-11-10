# Récupération, notifications et parcours personnel

## Accès

- `/mot-de-passe-oublie` : récupération par l’email déjà associé au compte.
- `/reinitialiser-mot-de-passe` : saisie d’un nouveau mot de passe depuis le lien reçu.
- `/espace/notifications` : événements de visite, état de lecture et préférence email.
- `/espace/favoris` : sélection personnelle synchronisée en base, filtrable et paginée.
- `/espace/recherches` : filtres du catalogue enregistrés, jusqu’à trente recherches par compte.
- `/espace/disponibilites` : plages des commerciaux du périmètre autorisé.

## Récupération du mot de passe

L’utilisateur a choisi une récupération **par email** et la préparation de **Resend**. Aucun SMS n’est revendiqué. Pour un compte sans email, un responsable peut réinitialiser le mot de passe depuis la fiche d’équipe dans son périmètre ; le site n’invente pas d’adresse de récupération.

Quand l’expédition est configurée, la réponse de demande est identique pour une adresse connue, inconnue, suspendue ou ayant déjà reçu un lien récemment. Limites persistantes par IP et adresse. Jeton aléatoire de 256 bits, hash SHA-256 en base, validité quinze minutes, une seule utilisation transactionnelle. Les changements de mot de passe et réinitialisations administratives invalident aussi les anciens liens. Une modification d’email ou de mot de passe depuis l’émission invalide le jeton. Le succès révoque toutes les sessions.

Le jeton circule dans le fragment du lien, jamais dans sa query HTTP. La page de saisie indique `no-referrer`. Il n’est renvoyé ni par l’API ni dans les journaux. Le contenu de la file d’expédition est chiffré par AES-256-GCM avec une clé dérivée d’AUTH_SECRET. Après acceptation du courrier par Resend, le contenu chiffré est effacé.

Sans configuration d’expédition complète, le formulaire explique la situation et l’API renvoie 503 pour tous les comptes. Aucun faux message d’envoi ni jeton de secours public.

## Préparer Resend

1. Ajouter et vérifier dans Resend un domaine d’expédition dont Barka possède les accès DNS, puis créer une clé limitée à l’envoi.
2. Dans `.env.vercel` privé, renseigner `RESEND_API_KEY` et `MAIL_FROM` (adresse ou format `BARKA <adresse@domaine-verifie>`), puis `MAIL_PROVIDER=resend`. La configuration locale utilise `.env`.
3. Reporter ces variables dans Vercel Production, clés marquées sensibles, puis redéployer. Conserver AUTH_URL sur l’origine HTTPS officielle. Ne jamais exposer ces clés avec NEXT_PUBLIC_.
4. Faire un contrôle réel avec une boîte mail autorisée, vérifier réception, expiration et connexion après réinitialisation. Aucun envoi réel n’a été effectué par les tests automatisés.
5. Désactiver le suivi des clics/ouvertures pour les emails de récupération afin de préserver le lien complet et la confidentialité.

Références officielles : [domaines vérifiés](https://resend.com/docs/dashboard/domains/introduction), [envoi d’un email](https://resend.com/docs/api-reference/emails/send-email), [idempotence](https://resend.com/docs/dashboard/emails/idempotency-keys).

## File d’envoi et reprise

Les mutations de visite écrivent leurs notifications internes et, lorsque le service est configuré et la préférence active, leur courrier dans la même transaction. L’envoi est tenté après la réponse HTTP par `after()`. Les erreurs d’expédition ne font pas disparaître la demande de visite ni sa notification.

Le worker utilise un verrou de ligne SKIP LOCKED, un bail de cinq minutes, cinq tentatives maximum et un délai croissant. Clé d’idempotence stable transmise à Resend ; les messages expirent avant la fin de la fenêtre d’idempotence de vingt-quatre heures. L’état SENT signifie accepté par le prestataire, pas livré ou lu. Aucun webhook de rebond ou de remise n’est encore intégré.

Reprise manuelle : `npm run mail:process`. L’endpoint `GET /api/cron/mail` exige `Authorization: Bearer <CRON_SECRET>` et traite un petit lot. Le secret est généré dans les fichiers privés locaux mais doit être synchronisé sur Vercel pour utiliser cet endpoint. Aucun cron payant ou plan d’hébergement n’est activé automatiquement. Brancher un ordonnanceur compatible avec le forfait, idéalement toutes les deux minutes, avant d’exploiter les reprises en continu ; sans ordonnanceur, les premières tentatives restent automatiques, mais les reprises différées dépendent du worker manuel ou des appels suivants.

Les emails de récupération expirent après quinze minutes ; les autres messages après vingt-trois heures. Le worker ignore les destinataires suspendus, les adresses modifiées, les anciennes demandes consommées et les utilisateurs qui ont désactivé les emails de visite. Les notifications internes restent disponibles indépendamment du prestataire.

## Notifications et favoris

Création de demande : notification du client, de l’auteur et du commercial actif, sans doublon de destinataire. Confirmation, refus, annulation et fin : notification du client et du commercial actif. Les liens professionnels ouvrent les demandes reçues ; les clients ouvrent leurs visites personnelles. Le centre se rafraîchit toutes les minutes, est paginé et ne retourne que les informations du compte courant. Le marquage de lecture d’un identifiant étranger ne le modifie pas.

Les favoris sont idempotents et liés à la session, jamais à un userId fourni par le navigateur. Les offres retirées ou expirées disparaissent de la liste visible mais peuvent toujours être retirées des favoris. L’ancien mode autonome `demo` conserve ses favoris locaux ; le catalogue de production utilise la base. Les recherches enregistrées stockent uniquement les filtres normalisés du catalogue ; elles ne déclenchent pas encore d’alertes automatiques sur les nouvelles annonces.

## Agenda

Plages concrètes de une à douze heures, de trente minutes à quatre-vingt-dix jours à l’avance, heure de Ouagadougou (UTC), cent plages futures maximum par commercial. SUPER_ADMIN global, autres professionnels limités à leur société et leur arbre, clients exclus. Les chevauchements sont refusés sous le verrou partagé des identités/visites. La création d’une plage active l’agenda ; sans agenda activé, le parcours existant de proposition libre est conservé. Un agenda activé mais vide ne propose aucun créneau.

La fiche du bien réel propose des créneaux d’une heure issus des plages publiées, en excluant les rendez-vous confirmés du commercial, du bien et du visiteur connecté. Jusqu’à quatre-vingts propositions sont affichées, sans coordonnées ni détail des rendez-vous concurrents. La demande et la confirmation relisent les plages. Une plage utilisée par un rendez-vous confirmé ne peut pas être retirée. Les rendez-vous confirmés ne sont pas déplacés ou annulés automatiquement lors d’une réaffectation du bien.

Pas encore de récurrence hebdomadaire, synchronisation Google/Outlook, rappel SMS ou délai automatique avant rendez-vous.

## Présentation des annonces

Les libellés « exemple » visibles ont été remplacés par « bien de présentation ». Les dix dossiers illustratifs conservent `isDemo`, leur statut descriptif et les visites simulées. Aucun titre foncier, identité vérifiée, adresse réelle ni disponibilité n’est inventé. Pour exploiter un bien comme offre réelle, créer un dossier ordinaire avec ses informations, médias autorisés, commercial vérifié et justificatifs, puis suivre la modération.

## Migrations

`202611100008_account_services` et `202611100009_saved_searches` sont additives : nouvelles tables, préférences et champs de notification. Elles ne suppriment aucun utilisateur, bien ou rendez-vous. Appliquer `prisma migrate deploy` avant le déploiement du code ; aucun seed ou import des annonces n’est requis.
