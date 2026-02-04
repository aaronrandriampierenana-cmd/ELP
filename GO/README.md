
# TRI EN  PARALLELE D'UNE LISTE

## Introduction
Le tri rapide ou Quick Sort est une méthode de tri rapide pour trier les listes en ordre croissant. 
Dans ce projet nous avons essayé d'améliorer cet algorithme en le parallélisant.
En effet en fonction du nombre de coeur de votre PC, le tri de la liste sera plus rapide. 

## Principe de fonctionnement
Ce projet fonctionne dans un pricipe de serveur client. Le client va générer une liste aléatoirement avec une taille donnée. 
Il l'envoie au serveur pour qu'il trie la liste. Le serveur découpe la liste en fonction du nombre de coeur du votre PC puis fait un Quick Sort sur chaque paquet en parallèle Une fois la liste triée, le serveur renvoie la liste au client.
Le client vérifie que la liste est bien trié et quelle fait la bonne taille. 

## Lanceement
Pour l'exécuter il faut d'abord lancer le programme trirapideparallele.go, le serveur, puis le programme client.go.
