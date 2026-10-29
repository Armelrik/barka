# Référence de visualisation des biens

L'utilisateur a fourni une seconde référence visuelle pour la future visionneuse : intérieur en plein écran, points interactifs violets, vignettes de pièces à droite, pellicule horizontale en bas et mini-plan à gauche. Cette référence guide la prochaine étape de visualisation ; la visionneuse n'est pas encore implémentée.

## Composition à reproduire

- Grande vue immersive aux angles arrondis, avec l'intérieur comme zone principale. Interface BARKA en français et police Poppins.
- Hotspots circulaires violet/bleu, centre plein et halo clair, permettant de changer de pièce ou d'afficher une information.
- Colonne flottante à droite : vignettes, nom de pièce et contour violet de la scène sélectionnée. Exemples de libellés : Salon, Cuisine, Chambre, Salle de bain.
- Flèches précédent/suivant sur les côtés de la vue.
- Barre de contrôle flottante en bas : sélecteur de scènes, précédent, lecture/pause de la visite guidée, suivant et plein écran.
- Pellicule de vignettes horizontales sous la barre ; scène active entourée de violet, défilement tactile.
- Mini-plan en bas à gauche, uniquement si un plan réel est fourni, avec position et orientation de la scène.
- Bouton de modèle 3D/dollhouse uniquement lorsqu'un modèle GLB/GLTF réel est disponible. Ne pas montrer un bouton sans action disponible.
- Retour clair vers la fiche du bien, titre de la pièce courante et fermeture accessible de toute information affichée.

## Adaptation mobile et accessibilité

Vue prioritaire, panneau de pièces repliable, vignettes horizontales tactiles et commandes d'au moins 44 px. Navigation clavier, noms accessibles, focus visible, annonce du changement de scène, plein écran avec sortie explicite et arrêt de la lecture automatique. Les contrôles ne doivent pas cacher les informations principales ni bloquer le geste de panorama.

## Données et rendu réels

Utiliser VirtualTour, TourScene, TourHotspot, MediaAsset et FloorPlan du schéma Prisma. Chaque scène panoramique doit disposer d'un média equirectangulaire autorisé ; rendu Pannellum ou Marzipano chargé à la demande. Les positions d'un panorama utilisent yaw/pitch. Un simple affichage de photo avec des points superposés ne doit pas être présenté comme une vraie visite 360°.

Les photographies d'ambiance actuelles du site ne sont pas des panoramas et ne permettent pas de produire automatiquement une vraie 3D. Une première maquette interactive sur ces images devra être explicitement nommée « aperçu photo ». Les médias des biens réels utiliseront le stockage objet prévu, avec contrôles d'accès et URLs signées ; aucun vrai document privé dans Git.

L'image source a été fournie dans la conversation, sans fichier local exploitable dans le dépôt. Cette spécification en conserve la composition et les comportements pour la reprise sur Mac.

## Acceptation avant livraison de la visionneuse

Navigation entre scènes réellement distinctes, état actif synchronisé entre hotspots/vignettes, chargement et erreur de média, plein écran, retour à la fiche, version mobile et clavier testés. Vérifier la cohérence des destinations et l'appartenance des scènes à la même visite au serveur. Ne proposer que les fonctions réellement prises en charge par les médias du bien.
