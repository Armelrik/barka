# Refonte de l'accueil BARKA

Mise à jour de l'identité : la palette ivoire/brun initiale est remplacée par le bleu nuit et l'or de la planche de marque fournie ensuite par l'utilisateur. Voir [brand.md](brand.md). Les visuels architecturaux, Poppins et la structure de l'accueil sont conservés.

Direction : référence visuelle fournie par l'utilisateur, hero architectural photographique pleine largeur, fond blanc/ivoire, accents brun chaud, boutons en pilule, navigation épurée et cartes de tailles variées. Contenu français, montants XOF et contexte Burkina Faso conservés.

Poppins 400/500/600 est auto-hébergée via `next/font/local` et appliquée dans le layout racine : titres, textes, navigation, boutons et formulaires. Fichiers `src/assets/fonts/Poppins-*.ttf`, issus du [dépôt officiel Google Fonts](https://github.com/google/fonts/tree/main/ofl/poppins), avec licence OFL fournie dans `src/assets/fonts/OFL.txt`. Aucune requête Google Fonts côté navigateur.

Ergonomie : formulaire de recherche, filtres rapides acheter/louer, état vide avec réinitialisation, favoris persistants dans localStorage, messages accessibles, navigation mobile repliable, focus clavier et réduction des animations selon préférence. Les favoris locaux ne nécessitent pas de compte ; aucune synchronisation serveur n'est annoncée.

## Visuels et provenance

Mode utilisé : outil intégré `image_gen.imagegen`, compétence imagegen. Quatre visuels originaux générés, inspectés puis copiés dans le projet. Les fichiers sources générés sont conservés. Optimisation responsive et chargement différé par `next/image`, préchargement du hero. Ces images sont des ambiances fictives et ne prouvent ni l'existence ni la disponibilité d'un bien. La page et les fiches le précisent.

| Asset final                        | Usage                 |
| ---------------------------------- | --------------------- |
| `public/design/barka-hero.png`     | Hero et exemple villa |
| `public/design/barka-interior.png` | Exemple duplex        |
| `public/design/barka-land.png`     | Exemple parcelle      |
| `public/design/barka-office.png`   | Exemple bureau        |

Ces assets graphiques statiques ne remplacent pas la future chaîne d'upload, le stockage objet privé, les contrôles de médias ou les visites 360°.

## Prompts finaux

### Hero

Create a photorealistic premium architectural real estate website HERO BACKGROUND, wide landscape 3:2 or wider composition. Reference is a warm minimalist real-estate website featuring a luxury contemporary villa on the RIGHT and ample pale sky on the LEFT for a dark text overlay. Only create the architectural photograph, NO website UI, NO text, no logo, no watermark. Contemporary two-story villa with expansive glass, warm walnut soffits, cream travertine, natural stone vertical wall, terrace and swimming pool, tropical/dry-climate landscaping appropriate to an aspirational West African residence, calm golden-hour sunlight. Villa occupies right 60 percent, left 40 percent is quiet luminous cream sky and distant landscaped horizon, no sea or ocean. Elegant neutral ivory, warm taupe, golden light and subtle blue pool. High-end editorial architecture photography, realistic proportions, cinematic but natural, crisp textures. This is a fictional architectural ambiance visual, not an actual property listing.

### Intérieur

Photorealistic architectural interior photograph for a luxury real estate website card, vertical 3:4 composition. A bright elegant contemporary living room with a warm cream curved sofa, walnut joinery, travertine floor, one large potted plant, full height glazing opening to a lush sunlit courtyard, warm West African afternoon light, sophisticated beige and caramel palette, editorial luxury property photography. Fictional architectural ambiance. No people, no text, no logos, no watermark.

### Parcelle

Photorealistic editorial real estate photograph of a beautiful undeveloped flat rectangular plot in a fictional residential district on the outskirts of Ouagadougou, Burkina Faso. Warm ochre sandy ground, neat simple pale boundary markers, a mature shea tree at one edge, low cream compound walls and a few modest contemporary houses far in the background, pale golden sky at late afternoon. Elegant high-end photography, quiet composition, dry savanna climate, no ocean, no mountains, no construction vehicles, no people, no text, no logo. Landscape 4:3. This is fictional illustrative land, not an actual sale listing.

### Bureau

Photorealistic editorial architecture photograph, tall 3:4 composition. Beautiful warm contemporary small office space: walnut desks, sand colored upholstered chairs, travertine floor, large windows facing a sunlit landscaped courtyard, natural linen curtains, indoor green plants, warm neutral cream taupe and rich walnut palette. Sophisticated airy real estate photography, warm afternoon lighting, no people, no computers with text, no text, no logos, no watermark. Fictional architectural ambiance for a website demo.
