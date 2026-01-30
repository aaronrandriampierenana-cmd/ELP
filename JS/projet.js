// Flip 7 multijoueur

const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}

function makeDeck() {
    const deck = [];
    for (let v = 1; v <= 7; v++) {
        for (let i = 0; i < 4; i++) deck.push(v);
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

function Busted(players) {
    return players.every(p => p.busted);
}

async function main() {
    console.log("=== Flip 7 Multijoueur (Terminal) ===");
    let n = Number(await ask("Nombre de joueurs (2 à 6): "));
    while (isNaN(n) || n < 2 || n > 6) { // Verif entrée est un nombre entre 2 et 6
        n = Number(await ask("Choisis un nombre entre 2 et 6: "));
    }

    const players = [];
    for (let i = 0; i < n; i++) {
        const name = await ask(`Nom du joueur ${i+1 } (enter = Joueur ${i+1 }): `);
        players.push({ name: name || `Joueur ${i+1 }`, cards: [], busted: false });
    }

    let deck = makeDeck();
    let joueurActuel = 0;
    let winner = null;

    while (!winner) {
        if (Busted(players)) {
            console.log("Tous les joueurs sont éliminés. Fin de manche.");
            break;
        }

        const p = players[joueurActuel];
        if (p.busted) {
            joueurActuel = prochainJoueur(players, joueurActuel);
            continue;
        }

        console.log("\n--- Tour de " + p.name + " ---");
        console.log("Cartes: " + (p.cards.join(", ") || "(aucune)"));
        const action = (await ask("Action (f = retourner, h = s'arrêter): ")).toLowerCase();

        if (action === "h") {
            console.log(p.name + " s'arrête.");
            joueurActuel = prochainJoueur(players, joueurActuel);
            break;
        }

        if (deck.length === 0) deck = makeDeck();
        const card = deck.pop();
        console.log(p.name + " retourne un " + card);

        if (p.cards.includes(card)) {
            p.busted = true;
            console.log("💥 Doublon, " + p.name + " est éliminé pour la manche.");
            joueurActuel = prochainJoueur(players, joueurActuel);
            continue;
        }

        if (players.length===1||action === "h") {
           console.log("🎉 " + p.name + " gagne la manche! le boss avec "+card);
           break;
        }
        p.cards.push(card);
        if (p.cards.length === 7) {
            winner = p;
            console.log("🎉 " + p.name + " gagne avec 7 cartes différentes 
                    ");
            break;
        }

        joueurActuel = prochainJoueur(players, joueurActuel);
    }

    rl.close();
}

main();
