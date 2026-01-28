package main

import (
	"elp/projet/types"
	"encoding/json"
	"fmt"
	"math/rand"
	"net"
	"sort"
	"time"
)

func genereListeAleatoire(taille int) []int {
	liste := make([]int, taille)
	for i := 0; i < taille; i++ {
		liste[i] = rand.Intn(1000000) // nombres aléatoires entre 0 et 999999
	}
	return liste
}

func main() {
	taille := 80000000
	fmt.Printf("Génération de %d nombres aléatoires...\n", taille)
	liste := genereListeAleatoire(taille)

	conn, err := net.Dial("tcp", "localhost:8080")
	if err != nil {
		panic(err)
	}
	defer conn.Close() // fermer la connexion à la fin

	debut := time.Now()
	encoder := json.NewEncoder(conn)
	decoder := json.NewDecoder(conn)

	fmt.Println("Envoi au serveur...")
	err = encoder.Encode(types.Entree{Numbers: liste}) // envoi de la liste au serveur
	if err != nil {
		panic(err)
	}

	var reponse types.Reponse
	err = decoder.Decode(&reponse)
	if err != nil {
		panic(err)
	}

	duree := time.Since(debut)
	fmt.Printf("Tri effectué en %s.\n", duree)

	fmt.Println("Vérification du tri...")
	if sort.IntsAreSorted(reponse.ListeTriee) { // on verifie que la liste est bien triée
		fmt.Println("SUCCESS : La liste est correctement triée !")
		if len(reponse.ListeTriee) == taille {
			fmt.Println("Taille correcte.")
		} else {
			fmt.Printf("ERREUR : Taille reçue %d (attendu %d)\n", len(reponse.ListeTriee), taille)
		}
	} else {
		fmt.Println("ERREUR : La liste n'est pas triée !")
	}
}
