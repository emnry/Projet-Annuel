function changement_trimestre(numero) {

    var boutons = document.getElementsByClassName("trimestres");

    for (var i = 0; i < boutons.length; i++) {
        boutons[i].style.backgroundColor = ""; 
    }

    boutons[numero-1].style.backgroundColor = "#3C3C3C";

}