const PARENT_PIN = "1234";

let etat = loadState();
let profilActifId = null;
let leconEnCoursId = null;
let indexQuestionEchauffement = 0;

function afficherEcran(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function initEcranLogin() {
  const conteneur = document.getElementById("cartes-profils");
  conteneur.innerHTML = "";
  ENFANTS.forEach((enfant) => {
    const carte = document.createElement("div");
    carte.className = `carte-profil ${enfant.id}`;
    carte.tabIndex = 0;
    carte.innerHTML = `
      <span class="mascotte-emoji">${enfant.emoji}</span>
      <span class="prenom">${enfant.prenom}</span>
    `;
    carte.addEventListener("click", () => connecterProfil(enfant.id));
    carte.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") connecterProfil(enfant.id);
    });
    conteneur.appendChild(carte);
  });
}

function connecterProfil(id) {
  profilActifId = id;
  etat.dernierProfil = id;
  const enfantState = etat[id];
  enfantState.derniereConnexion = new Date().toISOString();
  saveState(etat);
  afficherAccueil();
}

function afficherAccueil() {
  const enfant = getEnfant(profilActifId);
  const enfantState = etat[profilActifId];

  document.documentElement.style.setProperty("--couleur-profil", enfant.couleur);

  document.getElementById("profil-emoji-petit").textContent = enfant.emoji;
  document.getElementById("profil-prenom").textContent = enfant.prenom;

  document.getElementById("mascotte-grande").textContent =
    enfant.emojiPaliers[enfantState.palier];
  document.getElementById("mascotte-points").textContent = `${enfantState.points} points`;

  const restant = pointsAvantProchainPalier(enfantState.points);
  const barre = document.getElementById("barre-progression-remplie");
  if (restant === null) {
    barre.style.width = "100%";
    document.getElementById("mascotte-prochain-palier").textContent =
      "Palier maximum atteint pour l'instant !";
  } else {
    const palierActuelSeuil = PALIERS_POINTS[enfantState.palier];
    const palierSuivantSeuil = PALIERS_POINTS[enfantState.palier + 1];
    const progression =
      ((enfantState.points - palierActuelSeuil) / (palierSuivantSeuil - palierActuelSeuil)) * 100;
    barre.style.width = `${Math.max(0, Math.min(100, progression))}%`;
    document.getElementById("mascotte-prochain-palier").textContent =
      `Encore ${restant} points avant la prochaine évolution !`;
  }

  rendreOngletAccueil();
  rendreOngletParcours();
  changerOnglet("accueil");
  afficherEcran("screen-accueil");
}

function rendreOngletAccueil() {
  const enfantState = etat[profilActifId];
  const conteneur = document.getElementById("contenu-accueil");
  const suggestion = prochaineLecon(enfantState);

  if (!suggestion) {
    conteneur.innerHTML = `
      <h2>Bravo, tu as fini toutes les leçons disponibles !</h2>
      <p>De nouvelles leçons arriveront bientôt. En attendant, tu peux revoir celles que tu as déjà faites dans "Mon parcours".</p>
    `;
    return;
  }

  const modeLibre = estModeLibre();
  let html = `<h2>${modeLibre ? "Ta prochaine leçon suggérée" : "Ta leçon du jour"}</h2>`;
  html += rendreCarteLecon(suggestion, true);

  if (modeLibre) {
    const alternatives = alternativesLecon(enfantState, 2);
    if (alternatives.length > 0) {
      html += `<p style="margin-top: 20px; font-weight: bold;">Ou choisis une autre leçon :</p>`;
      html += `<div style="display:flex; gap:14px; flex-wrap:wrap; justify-content:center;">`;
      html += alternatives.map((l) => rendreCarteLecon(l, false)).join("");
      html += `</div>`;
    }
  }

  conteneur.innerHTML = html;

  conteneur.querySelectorAll("[data-lecon-id]").forEach((bouton) => {
    bouton.addEventListener("click", () => demarrerLecon(bouton.dataset.leconId));
  });
}

function rendreCarteLecon(lecon, misEnAvant) {
  const matiere = MATIERES[lecon.matiere];
  return `
    <div style="background:${misEnAvant ? matiere.couleur + "22" : "#f7f7f7"}; border: 3px solid ${matiere.couleur}; border-radius: 20px; padding: 18px; margin: 10px 0; ${misEnAvant ? "" : "width: 200px;"}">
      <div style="font-size: 2rem;">${matiere.emoji}</div>
      <div style="font-weight: bold; color: ${matiere.couleur};">${matiere.nom}</div>
      <div style="margin: 6px 0 12px;">${lecon.titre}</div>
      <button class="bouton" data-lecon-id="${lecon.id}">Commencer</button>
    </div>
  `;
}

function rendreOngletParcours() {
  const enfantState = etat[profilActifId];
  const conteneur = document.getElementById("contenu-parcours");
  const lignes = LECONS.map((l) => {
    const matiere = MATIERES[l.matiere];
    const fait = enfantState.leconsCompletees.includes(l.id);
    return `
      <div style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom: 1px solid #eee; text-align:left;">
        <span style="font-size:1.4rem;">${matiere.emoji}</span>
        <span style="flex:1;">${l.titre}</span>
        <span>${fait ? "✅" : "🔒"}</span>
      </div>
    `;
  }).join("");
  conteneur.innerHTML = `<h2>Mon parcours</h2><div>${lignes}</div>`;
}

function demarrerLecon(leconId) {
  leconEnCoursId = leconId;
  const enfantState = etat[profilActifId];
  const leconRevision = leconEchauffement(enfantState);
  if (leconRevision) {
    indexQuestionEchauffement = 0;
    afficherQuestionEchauffement(leconRevision);
    afficherEcran("screen-echauffement");
  } else {
    afficherLecon(leconId);
  }
}

function afficherQuestionEchauffement(leconRevision) {
  const question = leconRevision.echauffement[indexQuestionEchauffement];
  document.getElementById("echauffement-compteur").textContent =
    `Question ${indexQuestionEchauffement + 1} / ${leconRevision.echauffement.length}`;
  document.getElementById("echauffement-question").textContent = question.question;
  document.getElementById("echauffement-reponse-bloc").style.display = "none";
  document.getElementById("bouton-voir-reponse").style.display = "inline-block";
  document.getElementById("bouton-suivant-echauffement").style.display = "none";
}

function voirReponseEchauffement() {
  const enfantState = etat[profilActifId];
  const leconRevision = leconEchauffement(enfantState);
  const question = leconRevision.echauffement[indexQuestionEchauffement];
  document.getElementById("echauffement-reponse").textContent = question.reponse;
  document.getElementById("echauffement-explication").textContent = question.explication;
  document.getElementById("echauffement-reponse-bloc").style.display = "block";
  document.getElementById("bouton-voir-reponse").style.display = "none";
  document.getElementById("bouton-suivant-echauffement").style.display = "inline-block";
}

function questionSuivanteEchauffement() {
  const enfantState = etat[profilActifId];
  const leconRevision = leconEchauffement(enfantState);
  indexQuestionEchauffement++;
  if (indexQuestionEchauffement >= leconRevision.echauffement.length) {
    afficherLecon(leconEnCoursId);
  } else {
    afficherQuestionEchauffement(leconRevision);
  }
}

function afficherLecon(leconId) {
  const lecon = getLecon(leconId);
  const matiere = MATIERES[lecon.matiere];
  document.getElementById("lecon-matiere").textContent = `${matiere.emoji} ${matiere.nom}`;
  document.getElementById("lecon-matiere").style.color = matiere.couleur;
  document.getElementById("lecon-titre").textContent = lecon.titre;
  document.getElementById("lecon-intro").innerHTML = lecon.intro.map((p) => `<p>${p}</p>`).join("");
  document.getElementById("lecon-notions").innerHTML =
    "<strong>Ce qu'il faut retenir :</strong><ul>" +
    lecon.notionsCles.map((n) => `<li>${n}</li>`).join("") +
    "</ul>";
  document.getElementById("lecon-prerequis").textContent = "Déjà vu avant : " + lecon.prerequisCE2;
  document.getElementById("lecon-prolongement").textContent = "Pour aller plus loin : " + lecon.prolongement;
  afficherEcran("screen-lecon");
}

function terminerLecon() {
  const enfantState = etat[profilActifId];
  marquerLeconCompletee(enfantState, leconEnCoursId);
  saveState(etat);
  leconEnCoursId = null;
  afficherAccueil();
}

function changerOnglet(nom) {
  document.querySelectorAll("#screen-accueil .onglet").forEach((o) => o.classList.remove("actif"));
  document.querySelectorAll("#screen-accueil .contenu-onglet").forEach((c) => (c.style.display = "none"));
  document.getElementById(`onglet-${nom}`).classList.add("actif");
  document.getElementById(`contenu-${nom}`).style.display = "block";
}

function changerDeProfil() {
  profilActifId = null;
  afficherEcran("screen-login");
  initEcranLogin();
}

function ouvrirEspaceParent() {
  document.getElementById("pin-input").value = "";
  document.getElementById("pin-erreur").textContent = "";
  afficherEcran("screen-parent-pin");
}

function validerPin() {
  const valeur = document.getElementById("pin-input").value;
  if (valeur === PARENT_PIN) {
    afficherEcran("screen-parent-dashboard");
  } else {
    document.getElementById("pin-erreur").textContent = "Code incorrect, réessaie.";
  }
}

function quitterEspaceParent() {
  if (profilActifId) {
    afficherAccueil();
  } else {
    afficherEcran("screen-login");
    initEcranLogin();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initEcranLogin();
  afficherEcran("screen-login");

  document.getElementById("bouton-changer-profil").addEventListener("click", changerDeProfil);
  document.getElementById("lien-espace-parent").addEventListener("click", ouvrirEspaceParent);
  document.getElementById("bouton-valider-pin").addEventListener("click", validerPin);
  document.getElementById("bouton-annuler-pin").addEventListener("click", quitterEspaceParent);
  document.getElementById("bouton-quitter-parent").addEventListener("click", quitterEspaceParent);
  document.getElementById("pin-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") validerPin();
  });

  document.getElementById("onglet-accueil").addEventListener("click", () => changerOnglet("accueil"));
  document.getElementById("onglet-parcours").addEventListener("click", () => changerOnglet("parcours"));
  document.getElementById("onglet-badges").addEventListener("click", () => changerOnglet("badges"));

  document.getElementById("bouton-voir-reponse").addEventListener("click", voirReponseEchauffement);
  document.getElementById("bouton-suivant-echauffement").addEventListener("click", questionSuivanteEchauffement);
  document.getElementById("bouton-terminer-lecon").addEventListener("click", terminerLecon);
  document.getElementById("bouton-vers-exercices").addEventListener("click", () => {
    demarrerExercices(leconEnCoursId);
    afficherEcran("screen-exercices");
  });
});
