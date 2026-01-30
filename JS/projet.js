// Flip 7 multijoueur

const readline = require("readline");// Pour interaction terminal

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function demander(question) {
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

function prochainJoueur(joueurs, current) {
    let tries = 0; 
    do {
        current = (current + 1) % joueurs.length;
        tries++;
    } while ((joueurs[current].elimine || joueurs[current].arrete) && tries < joueurs.length);
    return current;
}

function Elimines(joueurs) { // Vérifie si tous les joueurs sont éliminés
    return joueurs.every(p => p.elimine); // Tous les joueurs sont éliminés
}

function valeurCarte(card) {
    if (typeof card === "number") return card;
    if (typeof card === "string") {
        if (/^\d+$/.test(card)) return Number(card);
    }
    return 0;
}

function sommeCartes(cards) {
    return cards.reduce((sum, c) => sum + valeurCarte(c), 0);
}

async function main() {
    console.log("=== Flip 7===");
    let n = Number(await demander("Nombre de joueurs (2 à 6): "));
    while (isNaN(n) || n < 2 || n > 6) { // Verif entrée est un nombre entre 2 et 6
        n = Number(await demander("Choisis un nombre entre 2 et 6: "));
    }

    const joueurs = [];
    for (let i = 0; i < n; i++) {
        const name = await demander(`Nom du joueur ${i+1 } (enter = Joueur ${i+1 }): `);
        joueurs.push({ name: name || `Joueur ${i+1 }`, cards: [], elimine: false, arrete: false, gele: false, secondeChance: 0, score: 0 });
    }

    let joueurActuel = 0;
    let manche = 1;
    let gagnant = null;

    while (!gagnant) {
        console.log("\n=== Manche " + manche + " ===");
        let deck = creerDeck();
        joueurs.forEach(p => {
            p.cards = [];
            p.elimine = false;
            p.arrete = false;
            p.gele = false;
            p.secondeChance = 0;
        });

        let finManche = false;
        while (!finManche) {
            if (Elimines(joueurs)) {
                console.log("Tous les joueurs sont éliminés. Fin de manche.");
                break;
            }

            if (joueurs.every(p => p.elimine || p.arrete)) {
                console.log("Tous les joueurs se sont arrêtés ou sont éliminés. Fin de manche.");
                break;
            }

            const p = joueurs[joueurActuel];
            if (p.elimine || p.arrete) {
                joueurActuel = prochainJoueur(joueurs, joueurActuel);
                continue;
            }

            if (p.gele) {
                console.log(p.name + " est gelé et saute ce tour.");
                p.gele = false;
                joueurActuel = prochainJoueur(joueurs, joueurActuel);
                continue;
            }

            console.log("\n--- Tour de " + p.name + " ---");
            console.log("Cartes: " + (p.cards.join(", ") || "(aucune)"));
            const action = (await demander("Action (f = retourner, h = s'arrêter): ")).toLowerCase();

            if (action === "h") {
                p.arrete = true;
                console.log(p.name + " s'arrête.");
                joueurActuel = prochainJoueur(joueurs, joueurActuel);
                continue;
            }

            let flipsRestants = 1;
            while (flipsRestants > 0) {
                flipsRestants--;
                if (deck.length === 0) deck = creerDeck();
                const card = deck.pop();
                console.log(p.name + " retourne un " + card);

                if (card === "S") {
                    p.secondeChance += 1;
                    console.log(p.name + " garde une seconde chance.");
                    continue;
                }

                if (p.cards.includes(card)) {
                    if (p.secondeChance > 0) {
                        p.secondeChance -= 1;
                        console.log(p.name + " utilise une seconde chance et continue.");
                        continue;
                    } else {
                        p.elimine = true;
                        console.log("Doublon, " + p.name + " est éliminé pour la manche.");
                        break;
                    }
                }

                p.cards.push(card);
                if (card === "F3") {
                    flipsRestants += 2; // flip 3 fois d'affilée au total
                }
                if (card === "F") {
                    const prochain = prochainJoueur(joueurs, joueurActuel);
                    if (prochain !== joueurActuel) {
                        joueurs[prochain].gele = true;
                        console.log(joueurs[prochain].name + " est gelé pour le prochain tour.");
                    } else {
                        console.log("Aucun autre joueur actif à geler.");
                    }
                }

                if (p.cards.length === 7) {
                    console.log(p.name + " gagne la manche avec 7 cartes différentes !");
                    finManche = true;
                    break;
                }
            }

            if (!finManche) {
                joueurActuel = prochainJoueur(joueurs, joueurActuel);
            }
        }

        console.log("\n--- Scores de la manche " + manche + " ---");
        joueurs.forEach(p => {
            const points = p.elimine ? 0 : sommeCartes(p.cards);
            p.score += points;
            console.log(p.name + ": +" + points + " points (total: " + p.score + ")");
        });

        const meilleurScore = Math.max(...joueurs.map(p => p.score));
        const gagnants = joueurs.filter(p => p.score >= 200 && p.score === meilleurScore);
        if (gagnants.length > 0) {
            gagnant = gagnants;
            break;
        }

        manche += 1;
        joueurActuel = prochainJoueur(joueurs, joueurActuel);
    }

    if (gagnant && Array.isArray(gagnant)) {
        if (gagnant.length === 1) {
            console.log("\n=== " + gagnant[0].name + " gagne la partie avec " + gagnant[0].score + " points ! ===");
        } else {
            const noms = gagnant.map(w => w.name).join(", ");
            console.log("\n=== Égalité ! Gagnants: " + noms + " avec " + gagnant[0].score + " points. ===");
        }
    }

    rl.close();
}

main();
