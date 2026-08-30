# Politique d’analyse WhatsApp indépendante

## Source de vérité

Uniquement les chats, métadonnées et messages WhatsApp bruts. Les anciennes tables Sales/CRM calculées sont hors périmètre.

## Segmentation en épisodes

Un chat est découpé en épisodes commerciaux distincts. Une nouvelle intention après une commande clôturée démarre un nouvel épisode. Une modification de panier avant clôture reste le même épisode et remplace les versions précédentes.

## Classification

### Confirmé

La transaction est soutenue par une preuve forte : paiement explicitement reçu, remise physique réellement effectuée, expédition/réception qui clôt sans ambiguïté l’épisode, ou combinaison équivalente.

`revenue_eligible` n’est vrai que si le montant final de cette transaction est lui aussi suffisamment prouvé.

### Probable / à valider

L’intention est forte mais un élément matériel manque : paiement final, montant, produit, quantité, attribution du CA, doublon possible ou fin de conversation ambiguë.

### Pas une vente

Demande de prix, liste d’attente, rupture sans conversion, paiement échoué sans alternative réussie, panier abandonné, commande annulée, ou simple discussion.

## Règles de montant

- Le dernier panier confirmé remplace les brouillons précédents.
- Un prix catalogue n’est pas utilisé rétroactivement comme preuve du montant encaissé.
- Les frais de livraison sont distingués du sous-total lorsqu’ils sont explicités.
- Les remises sont conservées lorsqu’elles sont explicites.
- Un remboursement diminue le CA net.
- Un remplacement de colis n’est pas une nouvelle vente.
- Plusieurs tentatives de paiement pour le même panier ne créent pas plusieurs ventes.

## Preuves

Chaque épisode conserve les IDs des messages ayant servi à établir : intention, produit, quantité, prix, remise, livraison, paiement, confirmation, annulation et fulfillment.

Le texte brut des messages n’est pas dupliqué dans le dépôt GitHub et n’a pas besoin d’être copié dans la base analytique.

## Conversion

Les broadcasts sortants, chats internes/tests et conversations sans intention commerciale sont exclus des dénominateurs lorsque la classification de chat le permet. Aucun taux de conversion n’est publié tant que le dénominateur n’est pas suffisamment fiable.
