// Flip 7 multijoueur

const readline = require("readline");// Pour interaction terminal

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function demander(question) { // Pose une question et retourne la réponse
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

function creerDeck() { // Crée et mélange le deck
    const deck = [0];
    for (let v = 1; v <= 12; v++) { 
        for (let i = 0; i <v; i++) deck.push(v);// Ajoute v copies de la carte v
    }
    for (let i=0; i<3;i++){
        deck.push("S");// seconde chance
        deck.push("F");// freeze
        deck.push("F3");// flip 3
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function prochainJoueur(players, current) {
    let tries = 0;
    do {
        current = (current + 1) % players.length;
        tries++;
    } while (players[current].busted && tries < players.length);
    return current;
}

function Elimines(players) { // Vérifie si tous les joueurs sont éliminés
    return players.every(p => p.elimine);
}

async function main() {
    console.log("=== Flip 7 Multijoueur (Terminal) ===");
    let n = Number(await demander("Nombre de joueurs (2 à 6): "));
    while (isNaN(n) || n < 2 || n > 6) { // Verif entrée est un nombre entre 2 et 6
        n = Number(await demander("Choisis un nombre entre 2 et 6: "));
    }

    const joueurs = [];
    for (let i = 0; i < n; i++) {
        const name = await demander(`Nom du joueur ${i+1 } (enter = Joueur ${i+1 }): `);
        joueurs.push({ name: name || `Joueur ${i+1 }`, cards: [], elimine: false });
    }

    let deck = creerDeck();
    let joueurActuel = 0;
    let gagnant = null;

    while (!gagnant) {
        if (Elimines(joueurs)) {
            console.log("Tous les joueurs sont éliminés. Fin de manche.");
            break;
        }

        const p = joueurs[joueurActuel];
        if (p.elimine) {
            joueurActuel = prochainJoueur(joueurs, joueurActuel);
            continue;
        }

        console.log("\n--- Tour de " + p.name + " ---");
        console.log("Cartes: " + (p.cards.join(", ") || "(aucune)"));
        const action = (await demander("Action (f = retourner, h = s'arrêter): ")).toLowerCase();

        if (action === "h") {
            console.log(p.name + " s'arrête.");
            joueurActuel = prochainJoueur(joueurs, joueurActuel);
            break;
        }

        if (deck.length === 0) deck = creerDeck();
        const card = deck.pop();
        console.log(p.name + " retourne un " + card);

        if (p.cards.includes(card)) {
            p.elimine = true;
            console.log("Doublon, " + p.name + " est éliminé pour la manche.");
            joueurActuel = prochainJoueur(joueurs, joueurActuel);
            continue;
        }

        if (joueurs.length===1||action === "h") {
           console.log(p.name + " gagne la manche! le boss avec !"+card);
           break;
        }
        p.cards.push(card);
        if (p.cards.length === 7) {
            gagnant = p;
            console.log(p.name + " gagne avec 7 cartes différentes !");
            break;
        }

        joueurActuel = prochainJoueur(joueurs, joueurActuel);
    }

    rl.close();
}

main();
