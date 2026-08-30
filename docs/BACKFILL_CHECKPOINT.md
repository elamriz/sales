# Checkpoint du backfill brut

État établi le 30 août 2026 à partir des outils de lecture WhatsApp brute.

- Chats actifs observés : **348**
- Messages bruts : **5 817**
- Messages entrants : **3 105**
- Messages sortants : **2 712**
- Premier message archivé : **2026-05-06 19:57:25 UTC**
- Dernier message archivé : **2026-08-29 22:37:37 UTC**
- Première passe chronologique : **complète sur les 5 817 messages**
- Passe ciblée des épisodes ambigus/récurrents : **en cours**
- Épisodes avec montant final déjà suffisamment prouvé dans le registre de travail : **au moins 76**
- Somme de ce sous-ensemble strictement validé : **8 510,60 EUR**

Cette somme est un **plancher de travail**, pas le chiffre d’affaires final. Des transactions effectivement réalisées restent volontairement exclues du montant tant que leur prix final n’est pas prouvé par les messages disponibles.

Aucune donnée client brute, numéro WhatsApp, adresse, e-mail ou contenu de conversation n’est stocké dans ce document.

## Reprise incrémentale prévue

Une fois la base dédiée créée :

1. inscrire un `analysis_run` de backfill ;
2. écrire les chats avec leur dernière borne analysée ;
3. écrire chaque épisode avec un `episode_key` stable ;
4. joindre les `order_evidence` par ID de message ;
5. placer toute incertitude en `review_queue` ;
6. lors des runs suivants, repartir de `last_analyzed_message_id` / `last_analyzed_message_at` au lieu de retraiter l’historique entier.
