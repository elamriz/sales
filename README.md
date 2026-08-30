# Sales Intelligence

Dashboard privé d’analyse commerciale reconstruit indépendamment à partir des messages WhatsApp bruts.

## Principes

- Les anciennes tables Sales/CRM ne sont jamais utilisées comme source de vérité.
- Une conversation peut contenir plusieurs épisodes de vente distincts.
- Une intention ou une demande de prix n’est pas une vente.
- Le CA confirmé n’inclut que les transactions confirmées dont le montant final est suffisamment prouvé (`revenue_eligible = true`).
- Les transactions réelles dont le montant est incertain restent visibles mais sont exclues du CA.
- Les preuves sont conservées par IDs de messages, sans copier les conversations brutes dans la base analytique.
- Les validations manuelles sont auditées.

## Stack

Next.js + TypeScript + Tailwind CSS + Recharts + Supabase + Vercel.

## Sécurité

Le dépôt est public. Ne jamais y ajouter : clés privées, tokens, numéros WhatsApp, adresses, e-mails clients, informations bancaires ou texte brut de conversations.

L’application exige une session Supabase Auth et une autorisation explicite dans `dashboard_users`. Les tables métier utilisent RLS.

## Configuration

Copier `.env.example` vers `.env.local` et renseigner uniquement les identifiants publics Supabase attendus. Les migrations sont dans `supabase/migrations`.

Sans configuration Supabase, l’application redirige vers `/setup` et n’affiche aucune donnée commerciale.
