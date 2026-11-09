# Présentation client

Version hébergée : **https://barka-ten.vercel.app**. Le Mac n’a pas besoin de rester allumé. Le catalogue de production utilise Neon en mode `database`, avec dix annonces fictives publiées et leurs photos sur Neon Object Storage privé. La charte Afriloc orange et turquoise est conservée.

## Parcours conseillé — environ dix minutes

1. `/` : présenter la recherche immobilière, les trois étapes et la sélection de biens. Les fonctions mises en avant correspondent au produit disponible ; aucun chiffre commercial fictif n’est revendiqué.
2. `/biens` : dix exemples, filtres achat/location, localisation, type et budget. Faire défiler les photos d’une carte, puis ouvrir « Voir le bien ».
3. Fiche : photos, caractéristiques pertinentes, prix en FCFA, localisation et simulation explicite d’une demande de visite. Les exemples ne déclenchent aucun rendez-vous réel.
4. `/carte` : retrouver les biens et ouvrir une fiche. Les localisations des exemples sont fictives.
5. `/visites/demo` : navigation entre pièces, visite guidée, plan et modèle 3D. Cette scène de démonstration ne représente pas les logements du catalogue.
6. `/contact` : montrer les parcours client, visite et professionnel, puis les réponses aux questions fréquentes. Aucun formulaire inactif ni fausse coordonnée n’est proposé.
7. `/inscription` : création d’un **compte client**, avec téléphone, email facultatif et acceptation des conditions. Utiliser uniquement des coordonnées autorisées si une inscription réelle est souhaitée ; les données saisies en ligne sont persistées.
8. `/connexion`, puis `/espace` avec le compte professionnel autorisé : indicateurs, derniers dossiers, répartition par commercial, équipe, visites, historique et paramètres selon le rôle. Les identifiants réels restent dans les fichiers privés et ne doivent pas être montrés à l’écran.
9. Refaire la navigation sur téléphone : menu, photos, catalogue et tableau de bord.

## Points à annoncer clairement

Les biens signalés « Exemple fictif » sont des illustrations, pas des offres disponibles. Dix exemples sont répartis à parts égales entre deux commerciaux de démonstration. Les anciens comptes et brouillons sont conservés. Un compte CLIENT créé publiquement ne reçoit aucun droit professionnel : l’administration attribue ces accès.

Le compte permet le suivi des demandes ; les responsables gèrent les dossiers et les accès dans leur périmètre. Le changement de mot de passe révoque les sessions. La récupération autonome de mot de passe, les notifications SMS/email, les réservations et les paiements restent à intégrer. Les favoris du catalogue autonome `demo` sont enregistrés dans le navigateur ; le catalogue connecté n’annonce pas encore cette fonction.

Le mode local `CATALOG_MODE=demo` conserve huit exemples autonomes pour le développement. Il n’est pas le catalogue de production. Les textes légaux restent consultables depuis le pied de page ; les informations définitives de l’exploitant et ses coordonnées devront être complétées pour le lancement commercial.

Guides : [back-office](backoffice.md), [gestion immobilière](property-management.md), [déploiement](vercel-neon.md), [vérifications](verification.md).
