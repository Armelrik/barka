# Sécurité — fondations et contrôles à intégrer

## État actuel : premier espace authentifié

Inscription CLIENT, connexion téléphone/email, sessions scellées et révocables en base, vérification d'origine, limitation persistante, audits et lectures privées filtrées sont désormais intégrés. Les détails, limites et contrôles réellement exécutés figurent dans [authentication.md](authentication.md) et [verification.md](verification.md). Les textes légaux restent des documents de travail, et l'inscription de production exige une activation explicite après leur validation. Les éléments de phase 1 ci-dessous décrivent l'état historique avant cette intégration ; uploads et paiements restent fermés.

## État de phase 1

Pas de collecte, route de connexion, upload ou paiement. Le catalogue utilise exclusivement des constantes fictives et ne contacte pas la base. En-têtes anti-sniffing, anti-framing et politique de référent fournis par Next.js. Le RBAC préparatoire est pur et testé ; il ne constitue pas une authentification. Aucun secret inclus dans le code ou le navigateur.

## Avant exposition des modules privés

- Choisir/configurer la bibliothèque d'authentification maintenue, sessions révocables, cookies HttpOnly/Secure/SameSite, défense CSRF adaptée, vérification d'origine, rate limiting distribué et stockage des secrets dans le gestionnaire de l'hébergeur.
- Valider chaque entrée avec Zod, normaliser téléphone/email ; rejeter les changements de société, rôle et parent dans les formulaires ordinaires. Filtrer les lectures privées avant pagination et appliquer la même autorisation dans les tâches et API.
- Séparer DTO public et privé. Ne jamais sérialiser hash, contact protégé, coordonnées personnelles exactes ou clés d'identité. Pas de cache partagé pour les pages personnalisées.
- Upload signé privé avec quotas, taille, extension, signature MIME réelle, analyse malveillante, état de quarantaine et URLs signées courtes. Nettoyer les métadonnées inutiles. Identité consultable avec permission et journal d'accès, rétention et suppression explicitement définies.
- En production : mock paiement refusé, signature webhook et vérification serveur, idempotence et transaction du paiement/droit/reçu/commission/outbox. Retour navigateur non probant.
- Audit écrit dans la transaction métier et en lecture seule pour les comptes d'application. Rôle de migration séparé ; protection contre modification/suppression des journaux à configurer au niveau PostgreSQL.
- CSP à établir avec nonce compatible Next.js et allowlists exactes des fournisseurs choisis ; ne pas introduire de domaines arbitraires pour Matterport, cartes ou médias.
- Définir les textes légaux, consentements, conservation et procédure d'accès/suppression avant collecte réelle ; aucune pièce d'identité réelle dans les seeds/tests.

## Validation du MVP

Tests d'intégration sur base dédiée : IDOR, multi-société/pays, descendant vs pair, cycles de hiérarchie, auto-promotion, mutation et audit atomiques, upload hostile, paiements concurrents/répétés et remboursement. Test de restauration base + objets, alerte sur jobs morts, examen des logs pour absence de données privées. Ces contrôles ne sont pas encore exécutés en phase 1.
