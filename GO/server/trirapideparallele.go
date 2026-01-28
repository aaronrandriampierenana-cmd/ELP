package main

import (
	"elp/projet/types"
	"encoding/json"
	"fmt"
	"net"
	"runtime"
	"sync"
)

func partitions(l []int) int {
	pivot := l[0]
	i := 1
	j := len(l) - 1

	for i <= j {
		for i < len(l) && l[i] <= pivot {
			i++
		}
		for j > 0 && l[j] >= pivot {
			j--
		}
		if i < j {
			l[i], l[j] = l[j], l[i]
		}
	}
	l[0], l[j] = l[j], l[0]
	return j
}

func QuickSortSeq(l []int) {
	if len(l) <= 1 {
		return
	}
	pivotIdx := partitions(l)
	QuickSortSeq(l[:pivotIdx])
	QuickSortSeq(l[pivotIdx+1:])
}

// Fonction de fusion de deux listes triées
func merge(left, right []int) []int {
	taille := len(left) + len(right)
	result := make([]int, 0, taille)
	i, j := 0, 0
	for i < len(left) && j < len(right) {
		if left[i] < right[j] {
			result = append(result, left[i])
			i++
		} else {
			result = append(result, right[j])
			j++
		}
	}
	result = append(result, left[i:]...)
	result = append(result, right[j:]...)
	return result
}

// On fusionne tous les segments de manière paralléle (deux par deux)
func FusionnerSegments(segments [][]int) []int {
	if len(segments) == 0 {
		return []int{}
	}
	if len(segments) == 1 {
		return segments[0]
	}
	if len(segments) == 2 {
		return merge(segments[0], segments[1])
	}
	milieu := len(segments) / 2
	var gauche []int
	var droite []int
	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		gauche = FusionnerSegments(segments[:milieu])
	}()
	go func() {
		defer wg.Done()
		droite = FusionnerSegments(segments[milieu:])
	}()

	wg.Wait()
	return merge(gauche, droite)
}

func TriParallele(liste []int) []int {
	NbCoeurs := runtime.NumCPU()
	// si la liste est petite, on utilise le tri séquentiel
	if len(liste) < 100*NbCoeurs {
		QuickSortSeq(liste)
		return liste
	}
	var wg sync.WaitGroup           // pour synchroniser les goroutines
	wg.Add(NbCoeurs)                // on lance NbCoeurs goroutines
	taille := len(liste) / NbCoeurs // taille de chaque segment
	segments := make([][]int, NbCoeurs)
	for i := 0; i < NbCoeurs; i++ {
		deb := i * taille
		fin := (i + 1) * taille
		if i == NbCoeurs-1 {
			fin = len(liste)
		}
		segments[i] = liste[deb:fin]
		go func(partie []int) {
			defer wg.Done()
			QuickSortSeq(partie)
		}(segments[i])
	}
	wg.Wait()
	return FusionnerSegments(segments)
}

// gérer la connexion avec le client
func handleClient(conn net.Conn) {
	defer conn.Close() // fermer la connexion à la fin

	decoder := json.NewDecoder(conn) // les messages sont en JSON
	encoder := json.NewEncoder(conn)

	var req types.Entree
	if err := decoder.Decode(&req); err != nil {
		fmt.Println("Erreur réception:", err)
		return
	}
	fmt.Printf("Reçu une liste de %d nombres. Traitement...\n", len(req.Numbers))

	listeTriee := TriParallele(req.Numbers)

	if err := encoder.Encode(types.Reponse{ListeTriee: listeTriee}); err != nil {
		fmt.Println("Erreur envoi:", err)
		return
	}
	fmt.Println("Tri terminé et renvoyé au client.")
}

func main() {
	PORT := ":8080"

	listener, err := net.Listen("tcp", PORT)
	if err != nil {
		panic(err)
	}
	defer listener.Close() // fermer le listener à la fin

	fmt.Printf("Serveur de tri parallèle démarré sur le port %s\n", PORT)
	fmt.Printf("Nombre de cœurs CPU utilisés : %d\n", runtime.NumCPU())

	for { // equivalent a while true
		conn, err := listener.Accept()
		if err != nil {
			fmt.Println("Erreur acceptation:", err)
			continue
		}
		go handleClient(conn)
	}
}
