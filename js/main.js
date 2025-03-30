async function getWikipediaSummary(title) {
    const url = `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.extract) {
            console.log(data.extract);
            return data.extract;
        } else {
            console.log("Article non trouvé");
            return null;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération de l'article", error);
        return null;
    }
}

getWikipediaSummary("France");

async function getRandomArticle() {
    
    const url = "https://fr.wikipedia.org/api/rest_v1/page/random/summary";
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        /*
        // Regenerer suivant la longueur
        
        if (Array.from(data.extract).length > 100){
            getRandomArticle();
        }
        */

        const wikiParagraph = document.querySelector('.wiki');

        /*
        console.log(`Titre: ${data.title}\nRésumé: ${data.extract}`);
        */
       
        if (wikiParagraph) {
            wikiParagraph.innerHTML = `<strong>${data.title}</strong>: ${data.extract}`;
        }
        
        return data;
    } catch (error) {
        console.error("Erreur lors de la récupération de l'article", error);
        return null;
    }
}


function gen() {
    
    var text = String(getRandomArticle());
    document.getElementById('p_ele').innerText = text;

};

document.addEventListener("DOMContentLoaded", () =>{
    getRandomArticle();
});