# Comptes, administration et catalogue de présentation

## Accès

`/inscription` crée uniquement un compte CLIENT : nom/prénom, téléphone normalisé, email facultatif, mot de passe d’au moins 12 caractères et acceptation des versions des conditions/confidentialité. Le client est rattaché au commercial d’accueil de BARKA. Aucun rôle, société ou parent fourni par le navigateur ne peut changer ce rattachement. L’ouverture des inscriptions et le réglage de validation des textes ont été autorisés par l’utilisateur le 10 novembre 2026.

`/connexion` accepte téléphone ou email, crée une session révocable de huit heures et ouvre `/espace`. `/admin` redirige les professionnels autorisés vers ce back-office ; un client ne peut pas y accéder. Pas d’authentification SMS/email ni de récupération autonome de mot de passe revendiquée : ces prestataires restent à intégrer.

`/espace/compte` affiche le profil et permet de changer son mot de passe après vérification du mot de passe actuel. Toutes les sessions sont révoquées, cookie compris ; une nouvelle connexion est demandée. Depuis une fiche d’équipe, un responsable peut réinitialiser le mot de passe d’un membre inférieur de son périmètre, avec contrôle de version, audit et révocation des sessions. Les réinitialisations ne permettent ni auto-modification via la route d’équipe, ni modification d’un pair/supérieur ou d’un utilisateur d’une autre société. Aucun mot de passe n’est renvoyé ni journalisé ; sa transmission au membre est manuelle et privée.

Sur Vercel, les limites par origine utilisent uniquement l’en-tête canonique `x-vercel-forwarded-for` fourni par la plateforme, avec validation de l’adresse IP. Sur un autre hébergement, les en-têtes proxy restent ignorés sauf configuration explicite. Les clés de compteurs sont hachées ; les limites de sécurité ne sont pas désactivées.

## Back-office

- `/espace` : indicateurs de biens, publications, demandes de visite à traiter et équipe ; derniers dossiers et répartition par commercial. Tous les chiffres proviennent de la base et du périmètre du compte.
- `/espace/equipe` : utilisateurs, création, rôles, statuts, rattachements et fiches ; mot de passe initial à la création et réinitialisation contrôlée sur la fiche.
- `/espace/biens` : dossiers attribués, création, modification, galerie, carte, visites immersives et workflow de publication.
- `/espace/visites?view=team` : demandes reçues et décisions de l’équipe.
- `/espace/verification` : vérification des profils professionnels selon permissions.
- `/espace/activite` : événements paginés, sans mots de passe, pièces ni contenu des messages. SUPER_ADMIN global ; ADMIN limité à sa société et aux événements de son équipe/système.
- `/espace/parametres` : délai de validation des prochaines publications de la société (1 à 90 jours), avec version et audit ; état des inscriptions, stockage et catalogue. Les annonces déjà publiées ne sont pas prolongées rétroactivement.

Les permissions sont contrôlées au serveur et relues sous verrou transactionnel lors des écritures. La navigation active reflète la page courante. Le thème Afriloc/AdminLTE est conservé avec les composants Next.js et les styles du projet.

## Dix biens fictifs connectés à la base

Les références `SHOWCASE-001` à `SHOWCASE-010` ont été créées dans la société BARKA-DEMO, sans modifier les quatre anciens brouillons ni les sept comptes conservés. Répartition : cinq biens au COMMERCIAL, cinq au DEFAULT_COMMERCIAL ; auteurs MANAGER/ADMIN en alternance, propriétaires associés via les relations existantes. Les illustrations Afriloc sont réencodées en JPEG et stockées dans le bucket privé `barka-uploads` ; les images peuvent être réutilisées entre exemples et ne décrivent pas un logement réel.

Le champ `Listing.isDemo` vaut false pour toute annonce ordinaire et n’est pas modifiable par les formulaires/API de création ou modification de biens. Les exemples exigent en plus la société BARKA-DEMO et `property.details.fictitious=true`. Ils sont étiquetés EXEMPLE FICTIF dans les cartes, fiches et marqueurs de la carte. Leur formulaire de visite simule la demande sans l’envoyer ; l’API refuse les rendez-vous réels sur ces références.

Les exemples ne forgent ni identité VERIFIED ni document foncier : les exigences de publication des offres réelles restent inchangées. Un exemple édité repasse en brouillon et conserve une modération indépendante ; une photographie reste obligatoire, les justificatifs légaux réels ne sont pas simulés. Les exemples publiés expirent au délai prévu, initialement quatorze jours.

L’import `npm run db:showcase` est une opération explicite réservée à l’exploitant, jamais exécutée au build. Il vérifie l’administrateur initial et les comptes de démonstration, ignore les références déjà présentes et nettoie les objets nouvellement déposés si la transaction échoue. Une seconde exécution sur Neon n’a pas été réalisée : le contrôle automatique l’a refusée, et les comptages/attributions ont été vérifiés en lecture seule.

## Limites actuelles

Pas de réservation/encaissement, de SMS/email automatique, de récupération autonome de mot de passe ni d’export financier. Les exemples du catalogue ne sont pas des offres réelles. Les validations juridiques et d’identité restent des actes humains ; les comptes fictifs sont conservés selon la demande de l’utilisateur.

Référence du proxy : [en-têtes de requête Vercel](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).
