const PARENT_PIN = "1234";

let etat = loadState();
let profilActifId = null;

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

  changerOnglet("accueil");
  afficherEcran("screen-accueil");
}

function changerOnglet(nom) {
  document.querySelectorAll(".onglet").forEach((o) => o.classList.remove("actif"));
  document.querySelectorAll(".contenu-onglet").forEach((c) => (c.style.display = "none"));
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
});
