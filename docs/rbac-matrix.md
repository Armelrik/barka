# Matrice RBAC — politique cible

L'autorisation est l'intersection permission × société/pays × arbre hiérarchique × propriété × état du dossier. Refus par défaut. Le niveau ne suffit jamais. Les profils OWNER, AGENT, AGENCY n'accordent aucune permission administrative.

| Rôle               | Niveau | Utilisateurs et rattachements     | Biens et annonces          | Modération            | Finances / paramètres            |
| ------------------ | -----: | --------------------------------- | -------------------------- | --------------------- | -------------------------------- |
| SUPER_ADMIN        |      6 | Global, autres comptes uniquement | Global                     | Global                | Global, opérations auditées      |
| ADMIN              |      5 | Descendants, même société         | Périmètre société autorisé | Société autorisée     | Société, hors paramètres globaux |
| SUPERVISOR         |      4 | Descendants stricts               | Équipe descendante         | Équipe descendante    | Lecture agrégée de son équipe    |
| MANAGER            |      3 | Commerciaux/clients descendants   | Équipe descendante         | Soumission uniquement | Lecture agrégée de son équipe    |
| COMMERCIAL         |      2 | Ses clients descendants           | Ses dossiers autorisés     | Aucune validation     | Ses relevés uniquement           |
| DEFAULT_COMMERCIAL |      2 | Nouveaux clients rattachés        | Identique commercial       | Aucune validation     | Ses relevés uniquement           |
| CLIENT             |      1 | Son profil, champs non sensibles  | Ses demandes/favoris       | Aucune                | Ses reçus/abonnements            |
| VISITOR            |      0 | Aucun compte                      | Catalogue publié gratuit   | Aucune                | Aucune                           |

## Règles obligatoires d'intégration

1. Charger l'acteur depuis une session vérifiée ; ignorer rôle, société et chaîne hiérarchique soumis par le client.
2. Filtrer les requêtes par société, pays et descendants autorisés avant pagination. Vérifier l'objet cible après lecture et avant écriture.
3. Attribution de rôle : permission `users.manage`, cible strictement inférieure, rôle attribué strictement inférieur, cible dans le sous-arbre, aucun changement sensible de son propre compte. SUPER_ADMIN seul attribue ADMIN ; création SUPER_ADMIN hors parcours ordinaire, procédure d'exploitation auditée.
4. Aucun cycle de rattachement, parent actif et plus haut, société identique ; transfert de sous-arbre réservé et audité.
5. Publication bloquée si profil démarcheur non vérifié ou documents requis absents ; le propriétaire ne valide pas son annonce.
6. Numéro protégé : paiement confirmé et droit ContactAccess non expiré au serveur ; jamais inclus dans un DTO public, HTML ou cache public.
7. Documents d'identité : permission dédiée et finalité, URL signée courte, journal d'accès. Modération et support n'impliquent pas automatiquement lecture d'identité.
8. Audit des rôles, rattachements, publications, documents et finances. Transaction commune pour écriture et audit ; pas de secrets dans le diff.

Le helper de phase 1 est désormais utilisé par les lectures privées. Les routes `/api/v1/users` et `/api/v1/users/:id` et l'annuaire `/espace/equipe` relisent permissions et périmètre depuis la base, avec filtrage avant pagination. Les opérations de modification de rôles/rattachements, de publication, de documents et de finances restent à implémenter et à tester dans leurs futurs services. Voir [authentication.md](authentication.md).
