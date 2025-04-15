// Table des mots solutions
const title_table = [];
const content_table = [];

// Traduit un mot via l'API MYMEMORY et renvoie le résultat
const translateWord = async (word) => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|fr`;
    try {
        // Requête API MYMEMORY
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur API: ${errorText}`);
        }

        // Retour de la traduction 
        const data = await response.json();
        return data.responseData.translatedText;

    } catch (error) {
        console.error('Erreur de traduction :', error.message);
        return null;
    }

};





// Vérifie si une page Wikipédia existe pour un mot donné
const checkWikipediaPage = async (title) => {
    const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    try {
        // Requête API Wiki 
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur API: ${errorText}`);
        }

        // Retour de l'ID de la page --> Si la page ne finis pas par ":" (courant sur certaines pages)
        const data = await response.json();
        if (data.extract?.trim().endsWith(':')) return null;
        return data.pageid;

    } catch (error) {
        console.error('Erreur dans la fonction checkWikipediaPage:', error);
        return null;
    }
};





// Donne un mot du même thème et renvoie le résultat traduit
async function getAssociatedWord() {

    // Récupère le thème choisi 
    const theme = document.getElementById('themeSelect').value;
    const url = `https://api.datamuse.com/words?rel_trg=${theme}&topics=${theme}`;

    try {
        // Requête API Datamuse
        const response = await fetch(url);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur API: ${errorText}`);
        }

        const data = await response.json();

        if (data.length === 0) {
            console.log(`Aucun mot associé trouvé pour le thème "${theme}".`);
            return null;
        }

        // Tenter plusieurs mots jusqu'à trouver une page wiki valide
        let found = false;

        while (found == false){

            // Sélectionne un mot aléatoire parmi les résultats
            const randomWord = data[Math.floor(Math.random() * data.length)].word;

            console.log(randomWord);
            const translated = await translateWord(randomWord);

            if (!translated) continue; // Si la traduction échoue, on passe au suivant

            const pageId = await checkWikipediaPage(translated);
            if (pageId) {
                found = true;
                return { translated, pageId };
            }
        }

        console.log("Aucune page Wikipédia valide trouvée après plusieurs tentatives.");
        return null;

    } catch (error) {
        console.error("Erreur dans getAssociatedWord :", error);
        return null;
    }
}





// Génère un ID vers une page wiki aléatoire et le met dans l'URL
async function link() {
    const theme = document.getElementById('themeSelect').value;

    // Confirmation de génération de la page
    if (confirm("Générer une nouvelle page ?")) {

        if (theme === "random") {

            const url = "https://fr.wikipedia.org/api/rest_v1/page/random/summary";

            try {

                // Requête vers Wikipédia pour une page aléatoire  
                const response = await fetch(url);
                const data = await response.json();

                // Vérification de l'existence de l'ID avant de procéder
                if (data.pageid) {
                    const id = data.pageid;

                    // Redirection vers la page avec l'ID en paramètre
                    window.location.href = `${window.location.pathname}?gameid=${encodeURIComponent(id)}&theme=${encodeURIComponent(theme)}`;
                }
                else {
                    console.error("Aucun ID de page trouvé dans la réponse de Wikipédia.");
                }

            } catch (error) {
                console.error("Erreur lors de la récupération de l'article", error);
            }
        }
        else {
            // Si un autre thème est sélectionné, obtenir l'ID associé
            const result = await getAssociatedWord();

            if (result && result.pageId) {
                window.location.href = window.location.pathname + '?gameid=' + encodeURIComponent(result.pageId) + '&theme=' + encodeURIComponent(theme);
            } else {
                alert("Impossible de trouver une page Wikipédia valide pour ce thème. Réessayez.");
            }
        }
    }
}






// Chargement de la page --> Génération de la page wiki si données en entête 
window.onload = launch;





// Génère la page wiki associée à l'ID dans l'entête
async function launch() {

    // Recherche de l'ID en paramètre
    const parameters = new URLSearchParams(window.location.search);
    const id = parameters.get('gameid');
    const theme = parameters.get('theme');

    document.getElementById("page-title").textContent = theme;



    // Si ID non trouvé
    if (!id) {
        console.log("Paramètre 'gameid' non trouvé");
        return null;
    }

    const queryUrl = `https://fr.wikipedia.org/w/api.php?action=query&pageids=${encodeURIComponent(id)}&format=json&origin=*`;

    try {

        // Requête vers Wikipédia pour obtenir le données associée à la page via l'ID  
        const queryResponse = await fetch(queryUrl);
        const queryData = await queryResponse.json();

        // Vérification si la page existe
        const pageInfo = queryData.query.pages[id];
        if (!pageInfo || !pageInfo.title) {
            console.error("Titre non trouvé pour l'id donné");
            return null;
        }

        // Recupération du titre de la page
        const title = pageInfo.title;

        const summaryUrl = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
        // Requête d'obtention de la page via le titre 
        const summaryResponse = await fetch(summaryUrl);

        // Erreur de récupération du résumé
        if (!summaryResponse.ok) {
            console.error(`Erreur lors de la récupération du résumé (status ${summaryResponse.status})`);
            return null;
        }

        const summaryData = await summaryResponse.json();

        if (summaryData.extract) {

            const title = document.getElementById('article-title-container');
            const content = document.getElementById('article-container');

            if (title && content) {

                // Option de débogage
                console.log(`${summaryData.title} : ${summaryData.extract}`);

                // Traitement du titre
                const titleWords = summaryData.title.match(/[a-zA-ZÀ-ÖØ-öø-ÿ0-9]+|[^\w\s]/gu); // Séparation au espaces et caractères spéciaux

                titleWords.forEach((element, index) => {
                    const span = document.createElement("span");

                    if (/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9\s]/.test(element)) { // Si c'est un caractère spécial --> Afficher le caractère 
                        document.getElementById('title-' + (index - 1)).style.marginRight = "1%";
                        span.textContent = element;
                        span.style.marginRight = "1%";
                    }
                    else {
                        span.textContent = "_".repeat(element.length);
                        span.style.marginRight = "4%";
                    }

                    title_table.push(element);
                    span.id = 'title-' + index;

                    title.appendChild(span);
                });

                // Traitement du contenu
                const contentWords = summaryData.extract.match(/[a-zA-ZÀ-ÖØ-öø-ÿ0-9]+|[^\w\s]/gu); // Séparation au espaces et caractères spéciaux

                contentWords.forEach((element, index) => {

                    const span = document.createElement("span");

                    if (/[^a-zA-ZÀ-ÖØ-öø-ÿ0-9\s]/.test(element)) { // Si c'est un caractère spécial --> Afficher le caractère 
                        document.getElementById('content-' + (index - 1)).style.marginRight = "1%";
                        span.textContent = element;
                        span.style.marginRight = "1%";
                    }
                    else {
                        span.textContent = "_".repeat(element.length);
                        span.style.marginRight = "4%";
                    }

                    content_table.push(element);
                    span.id = 'content-' + index;

                    content.appendChild(span);
                });

            }

        } else {
            console.log("Article non trouvé");
            return null;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'article", error);
        return null;
    }
}





// Normalise une entrée ex: "Entrée" --> entree
function normalizeString(str) {
    return str
        .toLowerCase() // met en minuscules
        .normalize("NFD") // sépare les caractères accentués
        .replace(/[\u0300-\u036f]/g, ""); // enlève les accents
}





// Fonction pour gérer l'animation et la mise à jour du texte
function revealWord(elementId, word) {
    const span = document.getElementById(elementId);

    // Animation d'apparition
    span.classList.add('hidden');

    setTimeout(() => {
        // Révélation du mot
        span.textContent = word;
        span.classList.add('guessed');
    }, 250); // Délai de 250 ms pour l'animation
}





// Traite une entrée de l'utilisateur
function guess(input) {

    // Normalisation de l'entree
    const normalizedInput = normalizeString(input);

    // Fonction générique pour traiter les tables
    function processTable(table, prefix) {
        table.forEach((element, index) => {
            if (normalizeString(element) === normalizedInput) {
                revealWord(`${prefix}-${index}`, element);
            }
        });
    }

    // Traitement des tables du titre et du contenu
    processTable(title_table, 'title');
    processTable(content_table, 'content');
}





// Après chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('game-form');
    const input = document.getElementById('form-input');

    // Gestion de la soumission du formulaire
    form.addEventListener('submit', function (event) {
        event.preventDefault(); // Empêcher le rechargement de la page
        guess(input.value); // Traitement de l'entrée 
        form.reset(); // Réinitialise l'input
    });
});