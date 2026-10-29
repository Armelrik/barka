# Modèle de données initial

## Agrégats

| Domaine      | Modèles                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Identité     | Country, Company, Agency, User, Role, Permission, RolePermission, UserHierarchy, AgentProfile, ClientProfile, Consent, AnnualSequence |
| Foncier      | Location, Property, PropertyOwnership, PropertyUnit, PropertyFeature, PropertyDocument, LegalCase                                     |
| Médias       | MediaAsset, PropertyMedia, VirtualTour, TourScene, TourHotspot, FloorPlan                                                             |
| Annonces     | Listing, ListingValidation, Favorite                                                                                                  |
| Demandes     | Booking, BookingEvent, VisitRequest                                                                                                   |
| Revenus      | SubscriptionPlan, Subscription, Payment, PaymentTransaction, ContactAccess, Commission, Receipt                                       |
| Exploitation | Notification, Advertisement, AuditLog, Setting, OutboxJob                                                                             |

Localisation arborescente : pays → région → province → commune → ville → quartier → section → lot → parcelle. Ce modèle supporte des pays avec des découpages différents ; la validation des niveaux et des cycles appartient aux services.

User porte un rôle hiérarchique et zéro ou plusieurs statuts métier. Chaque utilisateur appartient à une société. Company référence un seul commercial par défaut ; le service devra contrôler son rôle, son activité et son appartenance à la société. UserHierarchy stocke le parent direct ; calcul des descendants par requête récursive au MVP, fermeture matérialisée si nécessaire. Une agence appartient à une société ; un AgentProfile peut y être rattaché. Owner est une relation de copropriété avec quote-part facultative, pas un rôle d'administration.

Property contient le dossier physique et juridique. Listing contient l'offre, prix XOF, vente/location, validation et expiration. PropertyUnit décrit les pièces et étages ; les critères fréquemment filtrés (pièces, garage, compteurs, distances, viabilisation) sont des colonnes explicites ; les équipements complémentaires sont des PropertyFeature par code et unité. Les attributs spécifiques peu stabilisés restent dans `details` JSON documenté ; migrer les attributs réellement filtrés en colonnes/index lors du catalogue connecté. LegalCase ne modifie aucun droit foncier automatiquement.

MediaAsset stocke une clé d'objet, MIME, taille, statut et propriétaire, sans octets ni URL publique privée. PropertyDocument et AgentProfile référencent les objets privés. PropertyMedia décrit l'ordre et le rôle des photos/vidéos. Visites : VirtualTour → TourScene → TourHotspot, destination de scène et plan facultatifs. La cohérence même visite/source/destination sera vérifiée au serveur.

Montants en `Int` XOF, surfaces et coordonnées en Decimal. Limite Int PostgreSQL : 2 147 483 647 XOF ; passer aux unités BigInt avant offres dépassant ce plafond. Pourcentages en points de base (0–10000). Paiements et abonnements conservent le montant au moment de l'achat ; modifier un plan n'altère pas un reçu existant.

## Contraintes

FK restrictives sur données métier, cascades uniquement sur jointures dépendantes. Codes, références, téléphone, emails non nuls et identifiants externes uniques ; timestamps et index tenant/statut/date. Contraintes SQL supplémentaires : montants positifs, surface positive, coordonnées, absence d'auto-rattachement, commissions, séquence, unicité commerciale par défaut par société. Validation de cycles, chevauchements de réservation, somme des copropriétés, publication et transitions d'état à implémenter sous transaction.

Email optionnel avec unicité PostgreSQL sur valeurs non nulles, normalisé en minuscules. Téléphone normalisé au format E.164 ; sa possession n'est pas vérifiée à cette étape. Aucun champ de naissance n'est collecté par défaut. User.phoneVerifiedAt reste null sans vérification réelle. AuthSession conserve le hash d'un token opaque, l'utilisateur et son expiration ; AuthRateLimit porte les compteurs atomiques à clés HMAC. Le cookie de session est scellé par iron-session. Voir [authentication.md](authentication.md).

Le seed n'insère aucune vraie identité, téléphone de client, adresse email personnelle, pièce d'identité ou panorama. Ses comptes utilisent des identifiants de test et ne doivent jamais servir de données de production. Le catalogue visuel utilise le même jeu de biens fictifs que le seed, sans lire la base en phase 1.
