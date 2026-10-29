# Identité visuelle BARKA SARL

La planche fournie par l'utilisateur définit une identité bleu nuit et or, avec variantes du logo sur fonds clair et sombre, pictogramme et version horizontale. La police Poppins et la composition de l'accueil restent en place.

| Couleur retenue d'après la référence | Code      | Usage                                                                  |
| ------------------------------------ | --------- | ---------------------------------------------------------------------- |
| Bleu nuit                            | `#00263E` | Texte principal, navigation, filtres actifs, bloc de présentation      |
| Bleu profond                         | `#001B2E` | Pied de page et fond du favicon                                        |
| Or                                   | `#F4A51C` | Boutons principaux, fenêtres du pictogramme, accents et favoris actifs |
| Or foncé                             | `#A96A00` | Focus et accents sur fond clair                                        |
| Blanc                                | `#FFFFFF` | Fond principal et logo inversé                                         |
| Bleu clair                           | `#F2F6F9` | Surfaces secondaires                                                   |

Ces valeurs sont une interprétation de la planche affichée ; aucun fichier de charte avec codes colorimétriques exacts n'a été fourni. Les tokens sont centralisés dans `src/app/globals.css`. Les CTA dorés utilisent un texte bleu nuit pour conserver un contraste lisible.

Le composant `src/components/brand-logo.tsx` est une adaptation vectorielle du pictogramme architectural et du bloc de marque de la référence : tours, toiture, fenêtres bleu/or, nom BARKA, SARL et signature « L’immobilier en toute confiance ». Le header utilise la variante claire, le pied de page la variante inversée. `src/app/icon.svg` fournit le favicon bleu nuit, blanc et or.

Il s'agit d'un tracé adapté pour le site, pas d'une extraction exacte du fichier maître. Un futur SVG officiel pourra remplacer le pictogramme sans changer les emplacements ni la palette. Aucune génération raster n'est utilisée pour le logo.
