# Catalogue : filtres et quartiers

## Parcours

La page `/biens` conserve la charte Afriloc et affiche les résultats à gauche, deux cartes par ligne sur ordinateur, avec les filtres dans une colonne à droite. La colonne reste visible au défilement (`sticky`) et possède son propre défilement sur les écrans peu hauts. Sur téléphone, le panneau se place avant les résultats et peut être replié.

Ville et quartier sont voisins. La liste de quartiers se recherche sans distinction de casse ou d’accent ; sélection au pointeur, flèches, Entrée et Échap. La sélection d’un quartier précise sa ville si nécessaire. Changer de ville efface le quartier précédent. Une saisie libre permet aussi de chercher une localisation encore absente de la liste.

Les critères cumulables sont : achat/location, ville, quartier, prix minimum et maximum, type de bien, meublé/non meublé, location courte/longue durée et période du prix (nuit/semaine/mois). Les fourchettes inversées, prix négatifs et paramètres invalides sont refusés. Le filtre de période évite de comparer silencieusement un tarif par nuit et un tarif mensuel.

Tris : plus récent, plus ancien, prix croissant et prix décroissant. Dates de publication puis de création et identifiant départagent les égalités. Les filtres actifs se conservent dans l’URL, les pages suivantes, les favoris et les recherches enregistrées. Un changement de critères repart de la première page. Les anciennes catégories villa/parcelle/bureau restent acceptées pour préserver les liens existants.

Les nouveaux types sont appartement, maison mitoyenne, boutique, entrepôt, espace de vente et maison d’hôtes ; les maisons, villas, duplex, bureaux et terrains existants restent pris en charge.

## Données des biens

Les champs ameublement, durée de location et période du tarif sont modifiables dans le formulaire de dossier immobilier. Les deux premiers sont facultatifs : les anciennes annonces restent « non renseignées », sans les considérer arbitrairement comme non meublées ou louées à long terme. Leur tarif existant conserve la période mensuelle utilisée auparavant. Un critère explicite n’inclut que les biens ayant cette information renseignée.

La migration additive `202611100010_catalog_filters` ajoute les types et colonnes nécessaires. Elle ne modifie ni les statuts, ni les auteurs/commerciaux, ni les pièces justificatives. Les conditions de publication et de visibilité restent appliquées avant tout filtre.

## Référentiel des quartiers

Source principale téléchargée le 10 novembre 2026 : [AMMA-2050, Technical Report VI, mars 2019, tableau 7 p. 28](https://www.ceh.ac.uk/sites/default/files/2023-01/AMMA-2050-technical-support-6-Flood-Vulnerability-Index.pdf), attribué à la Commune de Ouagadougou, 2012. Les 77 noms distincts du tableau ont été extraits et dédupliqués par nom. Il s’agit d’un référentiel de recherche historique et non d’une certification administrative actuelle exhaustive.

Le JSON `src/data/ouagadougou-neighborhoods.json` conserve la source, sa date et son empreinte SHA-256. Le rapport PDF complet reste en `.tmp/sources` ; seul le référentiel factuel est livré. Les variantes orthographiques facilitent la recherche ; elles ne remplacent pas un code administratif. La liste est complétée par les quartiers déjà enregistrés dans Barka, notamment les usages immobiliers et les autres villes.

Téléchargement du CSV : `/data/quartiers-ouagadougou.csv`. Son rattachement d’arrondissement est explicitement celui de la source 2012. Les autres villes affichent leurs quartiers enregistrés, sans leur attribuer artificiellement des quartiers de Ouagadougou.

`npm run db:neighborhoods` simule l’intégration dans le référentiel BF ; `npm run db:neighborhoods -- --apply` crée uniquement les quartiers manquants sous la ville Ouagadougou existante. Les localisations déjà présentes sont conservées, ainsi que leurs rattachements aux biens. Les codes internes BARKA ne prétendent pas être des codes officiels. L’import n’est jamais lancé au build. En présence de villes homonymes, préciser `--city-code=...` : pour cette livraison, l’entrée de production `BF-CITY-OUAGADOUGOU` a été sélectionnée explicitement ; l’ancienne entrée `DEMO-CITY` et tous ses rattachements sont conservés.

La référence [Meqasa](https://meqasa.com/apartments-for-rent-in-Greater%20Accra-region) a servi pour l’organisation des filtres et la diversité des types, sans reprise de ses annonces ou de ses médias.

## Navigation et défilement

Le comportement par défaut de Next.js peut conserver la position si la nouvelle page est déjà visible. La navigation vers un nouveau chemin repart désormais en haut après le rendu, sans animation de défilement CSS globale ni déplacement forcé du focus. Les liens avec ancre et les retours/précédents du navigateur gardent leur comportement dédié.

Les changements de filtre sur le même chemin positionnent les résultats sous la navbar ; les cartes ont un espace réservé et l’ancrage automatique aux anciennes cartes est désactivé. Le chargement général réserve une hauteur d’écran pour éviter que le pied de page soit sélectionné pendant le chargement.
