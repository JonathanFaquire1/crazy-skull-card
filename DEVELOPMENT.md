# Environnement de développement isolé

Cette branche `development` part du commit de production `02b47d183e505c714f8da9c69db039356b5fe35c`. Ne pas fusionner cette configuration dans master et ne pas promouvoir la Preview.

## Connexions

- GitHub : JonathanFaquire1/crazy-skull-card, branche development.
- Vercel : crazy-skull-card, équipe team_SqxGb4MZu4Fipk1Kc3YQk4WX, cible Preview uniquement.
- Supabase Dev : Crazy Skull Card Dev, référence epoffgdhajtdvkvlreae, région eu-central-1.
- Production à préserver : Supabase oozzpzjolbybgovzyzla, master et domaines crazyskullcards.fr / www.crazyskullcards.fr.

`config/development.cjs` contient uniquement l’URL et la clé publiable du projet Dev. Cette clé est destinée au navigateur et ne remplace pas les règles RLS. Aucune clé service_role n’est utilisée. `next.config.js` impose ces valeurs pour tous les clients Supabase existants, même si Vercel fournit des variables héritées de production. Les URL de cartes, QR et vCard utilisent l’URL unique du déploiement Preview ; en local, localhost:3000.

Le chargement de la configuration refuse une cible Vercel Production et toute branche Vercel autre que development. Le bandeau et les en-têtes noindex identifient les pages de test. Ces mesures ne remplacent pas la protection d’accès Vercel.

## Base de développement

`docs/development-schema.sql` recrée les cinq tables applicatives, contraintes, index, fonctions, politiques et un bucket avatars vide, à partir des métadonnées de la base existante. Aucune ligne de production, aucun compte Auth, aucun SKU et aucun fichier n’est copié.

La base applique RLS aux tables. Le déclencheur d’inscription crée toujours un rôle client dans un schéma privé ; les utilisateurs ne peuvent pas modifier leur rôle. Les statistiques de vues sont limitées au propriétaire et seules les cartes actives ou possédées sont visibles. `docs/development-workflows.sql`, appliqué après le schéma initial, ajoute la réservation atomique NFC, le contrôle administrateur et les événements de compteurs. Les visiteurs peuvent enregistrer un événement autorisé mais ne peuvent pas modifier une carte. Les trois comptes fictifs de vérification sont temporaires, distincts des utilisateurs réels.

Ne jamais exécuter ce SQL sur la production. Il ne s’agit pas d’une migration de production ni d’un audit de sécurité complet.

## Vérification locale

```text
npm ci --ignore-scripts
node scripts/check-isolation.cjs
npm run build
npm run dev
```

Utiliser uniquement des identités fictives et des fichiers de test. Les redirections Supabase Auth sont configurées pour l’alias stable `https://crazy-skull-card-git-development-jonathanfaquire1s-projects.vercel.app/**` et `http://localhost:3000/**`. Le callback `/auth/callback` échange le code PKCE et limite les destinations autorisées. Le service d’emails Supabase par défaut est conservé, avec ses restrictions aux adresses autorisées. Ne pas réutiliser le SMTP, les comptes ou les cartes physiques de production.

`scripts/test-development.cjs` vérifie les parcours et les refus d’accès avec des identifiants fictifs fournis par `CSC_TEST_FIXTURES` (JSON hors dépôt), et écrit un rapport sans secrets dans `CSC_TEST_REPORT`. Les codes SKU99001 et SKU99002 sont réservés à cette exécution de test. Ce script ne doit être utilisé que sur le projet Dev et un jeu de fixtures neuf. Les tests ne valident pas la programmation physique d’une puce NFC ni la délivrabilité réelle des emails.

Le connecteur Vercel a refusé la lecture et l’écriture des variables (403), et le CLI n’a pas accès à l’équipe. La configuration dédiée au code évite de dépendre de ces variables. Les dépendances existantes présentent des alertes de sécurité ; cette version est un environnement de travail, pas une autorisation de commercialiser.
