# Référence graphique Afriloc

Source : https://github.com/Armelrik/afriloc.git, branche par défaut, commit `dc651bef074e824af63237b4f00e5771f6b2a1d7`. Extraction le 9 novembre 2026, à la demande de l'utilisateur, pour reprendre l'interface validée par le client.

Les fichiers `.blade.txt` sont les gabarits de référence, conservés comme documentation : ils ne sont ni exécutés ni servis. `public-theme.css` est la charte Tailwind publique ; `admin-theme.css` et `adminlte.css` conservent le système graphique de l'administration. Aucun code métier Laravel, secret, compte ni donnée de base n'est importé.

## Charte publique

- Inter 400/500/600/700, désormais auto-hébergée, fichier variable issu de `rsms/inter`, licence fournie dans `src/assets/fonts/Inter-LICENSE.txt`.
- Orange principal `#f97316`, survol `#ea580c`, palette 50–900 du CSS source.
- Turquoise `#14b8a6`, palette 50–900 ; dégradés orange → turquoise.
- Texte `#0f172a`, corps gris 600, blanc et gris 50 ; footer gris 900.
- Navigation blanche fixe avec ombre, logo maison dans carré dégradé de 40 px, marque BARKA 24 px.
- Hero plein écran : `ouaga-hero.jpg`, dégradé sombre, titre 30 à 72 px selon breakpoint, boutons arrondis 8 px et statistiques vitrées.
- Sections à espacements 48/64/80 px, grilles 1/2/3 colonnes, cartes arrondies 12 px, photographies de 256 px, prix orange, badges pilule.
- Breakpoints Tailwind source : 640/768/1024/1280/1536 px.
- Footer quatre colonnes, réseaux, contact, newsletter et liens légaux.

## Charte administration

Source Sans Pro 400/600/700 auto-hébergée depuis les fichiers fournis par Google Fonts, licence Adobe conservée. Sidebar 250 px, dégradé `#2c3e50` → `#1a252f`, bleu d'action `#3498db`, fond `#f4f6f9`, cartes 12 px, ombres et tables à en-tête sombre. Les styles sont adaptés aux espaces des équipes (`/espace` et `/espace/equipe`) sans charger Bootstrap/jQuery ni remplacer les contrôles d'accès existants.

## Transposition dans Barka

| Source                                         | Destination                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `home.blade.txt`                               | `src/app/page.tsx` : structure, classes responsive et pictogrammes SVG repris |
| `header.blade.txt`                             | `src/components/site-header.tsx` : navigation, menu et fenêtres modales       |
| `footer.blade.txt`                             | `src/components/site-footer.tsx`                                              |
| `property-card.blade.txt`, `catalog.blade.txt` | `src/components/catalog.tsx`, `/biens`                                        |
| `property.blade.txt`                           | `/biens/[slug]`                                                               |
| `login.blade.txt`, `register.blade.txt`        | AuthShell et formulaires existants ; pages et fenêtres modales                |
| `contact.blade.txt`                            | `/contact` : présentation, formulaire non activé                              |
| Styles AdminLTE                                | `src/app/account.css`, layout `/espace`                                       |
| `public/images`                                | `public/afriloc` : fichiers copiés sans modification                          |

Les photos ont la provenance du dépôt fourni ; aucune existence ou disponibilité d'un bien n'en est déduite. La galerie reste liée aux quatre données fictives de Barka. Les photographies générées de la précédente direction sont conservées dans `public/design`, mais ne pilotent plus le catalogue.

## Écarts fonctionnels explicites

La reprise porte sur la présentation. Les routes suivent Barka (`/biens`, `/connexion`, `/inscription`, `/espace`). Les formulaires gardent les champs et validations du socle actuel, notamment téléphone/email et consentement. L'inscription promoteur aboutit actuellement à l'inscription client ; aucun rôle professionnel n'est attribué par le navigateur. La langue française est active ; le repère EN est inactif. Newsletter, contact, coordonnées et réseaux n'ont pas de service configuré. Les chiffres marketing historiques sont identifiés comme illustratifs. Les réservations et paiements ne sont pas activés.

Les écrans métier de l'ancien projet qui n'existent pas encore dans Barka ne sont pas recréés avec de fausses données opérationnelles. Les gabarits et styles extraits constituent la référence pour leur développement ultérieur.

La structure de l'accueil est transposée depuis les sources. Aucune comparaison pixel à pixel avec une instance Laravel exécutée n'a été réalisée ; les contrôles navigateur portent sur le rendu Barka, la navigation et la version mobile.
