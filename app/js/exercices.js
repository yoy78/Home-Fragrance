const MAX_TENTATIVES = 3;

let exercicesEnCours = [];
let indexExercice = 0;
let tentativesExercice = 0;
let resultatsExercices = [];
let selectionGauche = null;
let pairesResolues = [];
let permutationDroite = [];

function normaliser(texte) {
  return String(texte)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function reponseCorrecte(exercice, saisie) {
  const valeur = normaliser(saisie);
  return exercice.reponsesAcceptees.some((r) => normaliser(r) === valeur);
}

function demarrerExercices(leconId) {
  const lecon = getLecon(leconId);
  exercicesEnCours = lecon.exercices || [];
  indexExercice = 0;
  resultatsExercices = [];
  if (exercicesEnCours.length === 0) {
    afficherRecapExercices();
  } else {
    afficherExerciceCourant();
  }
}

function libelleNiveau(niveau) {
  return { decouverte: "Découverte", application: "Application", defi: "Défi" }[niveau] || niveau;
}

function afficherExerciceCourant() {
  tentativesExercice = 0;
  selectionGauche = null;
  pairesResolues = [];
  const exercice = exercicesEnCours[indexExercice];

  document.getElementById("exercice-compteur").textContent =
    `Exercice ${indexExercice + 1} / ${exercicesEnCours.length} — ${libelleNiveau(exercice.niveau)}`;
  document.getElementById("exercice-enonce").textContent = exercice.enonce;
  document.getElementById("exercice-feedback").innerHTML = "";
  document.getElementById("exercice-feedback").className = "";

  const zone = document.getElementById("exercice-zone-interactive");
  zone.innerHTML = "";

  if (exercice.type === "saisie") {
    zone.innerHTML = `
      <input type="text" id="saisie-reponse" class="pin-champ" style="width: 260px; font-size: 1.1rem;" autocomplete="off" />
      <div><button class="bouton" id="bouton-valider-exercice" style="margin-top: 14px;">Valider</button></div>
    `;
    document.getElementById("saisie-reponse").focus();
    document.getElementById("saisie-reponse").addEventListener("keydown", (e) => {
      if (e.key === "Enter") validerExerciceSaisie();
    });
    document.getElementById("bouton-valider-exercice").addEventListener("click", validerExerciceSaisie);
  } else if (exercice.type === "association") {
    permutationDroite = melanger(exercice.paires.map((p, i) => i));
    zone.innerHTML = `
      <div style="display:flex; gap: 40px; justify-content: center;">
        <div id="colonne-gauche" style="display:flex; flex-direction:column; gap:10px;">
          ${exercice.paires.map((p, i) => `<button class="onglet" data-side="gauche" data-i="${i}">${p.gauche}</button>`).join("")}
        </div>
        <div id="colonne-droite" style="display:flex; flex-direction:column; gap:10px;">
          ${permutationDroite.map((i) => `<button class="onglet" data-side="droite" data-i="${i}">${exercice.paires[i].droite}</button>`).join("")}
        </div>
      </div>
    `;
    zone.querySelectorAll("[data-side]").forEach((bouton) => {
      bouton.addEventListener("click", () => cliquerAssociation(bouton));
    });
  } else if (exercice.type === "zone") {
    zone.innerHTML = `
      <div style="display:flex; gap: 10px; flex-wrap: wrap; justify-content: center;">
        ${exercice.zones.map((z) => `<button class="onglet" data-zone="${z}">${z}</button>`).join("")}
      </div>
    `;
    zone.querySelectorAll("[data-zone]").forEach((bouton) => {
      bouton.addEventListener("click", () => validerExerciceZone(bouton.dataset.zone));
    });
  }
}

function melanger(tableau) {
  const copie = [...tableau];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

function afficherIndiceOuReponse(exercice, correct) {
  const feedback = document.getElementById("exercice-feedback");
  if (correct) {
    feedback.innerHTML = `<p style="color:#2f9e44; font-weight:bold;">Bravo, c'est la bonne réponse !</p><p>${exercice.explication}</p>`;
    resultatsExercices.push(true);
    afficherBoutonSuivantExercice();
    return;
  }

  if (tentativesExercice < MAX_TENTATIVES) {
    const indice = exercice.indices[Math.min(tentativesExercice - 1, exercice.indices.length - 1)];
    feedback.innerHTML = `<p style="color:#e0574c;">Pas tout à fait ! Indice : ${indice}</p>`;
  } else {
    feedback.innerHTML = `<p style="color:#e0574c; font-weight:bold;">La bonne réponse était : ${resumeReponse(exercice)}</p><p>${exercice.explication}</p>`;
    resultatsExercices.push(false);
    afficherBoutonSuivantExercice();
  }
}

function resumeReponse(exercice) {
  if (exercice.type === "saisie") return exercice.reponsesAcceptees[0];
  if (exercice.type === "zone") return exercice.zoneCorrecte;
  if (exercice.type === "association") return exercice.paires.map((p) => `${p.gauche} → ${p.droite}`).join(", ");
  return "";
}

function afficherBoutonSuivantExercice() {
  const zone = document.getElementById("exercice-zone-interactive");
  const estDernier = indexExercice >= exercicesEnCours.length - 1;
  const bouton = document.createElement("button");
  bouton.className = "bouton";
  bouton.style.marginTop = "14px";
  bouton.textContent = estDernier ? "Voir mon résultat" : "Exercice suivant";
  bouton.addEventListener("click", () => {
    indexExercice++;
    if (indexExercice >= exercicesEnCours.length) {
      afficherRecapExercices();
    } else {
      afficherExerciceCourant();
    }
  });
  zone.appendChild(document.createElement("br"));
  zone.appendChild(bouton);
}

function validerExerciceSaisie() {
  const exercice = exercicesEnCours[indexExercice];
  const champ = document.getElementById("saisie-reponse");
  tentativesExercice++;
  const correct = reponseCorrecte(exercice, champ.value);
  afficherIndiceOuReponse(exercice, correct);
  if (!correct && tentativesExercice < MAX_TENTATIVES) {
    champ.value = "";
    champ.focus();
  } else {
    champ.disabled = true;
    document.getElementById("bouton-valider-exercice").disabled = true;
  }
}

function validerExerciceZone(zoneChoisie) {
  const exercice = exercicesEnCours[indexExercice];
  tentativesExercice++;
  const correct = zoneChoisie === exercice.zoneCorrecte;
  document.querySelectorAll("[data-zone]").forEach((b) => (b.disabled = true));
  afficherIndiceOuReponse(exercice, correct);
  if (!correct && tentativesExercice < MAX_TENTATIVES) {
    document.querySelectorAll("[data-zone]").forEach((b) => (b.disabled = false));
  }
}

function cliquerAssociation(bouton) {
  const exercice = exercicesEnCours[indexExercice];
  const side = bouton.dataset.side;
  const i = parseInt(bouton.dataset.i, 10);

  if (side === "gauche") {
    if (pairesResolues.includes(i)) return;
    document.querySelectorAll('[data-side="gauche"]').forEach((b) => b.classList.remove("actif"));
    bouton.classList.add("actif");
    selectionGauche = i;
    return;
  }

  if (selectionGauche === null || pairesResolues.includes(selectionGauche)) return;

  tentativesExercice++;
  if (i === selectionGauche) {
    bouton.disabled = true;
    bouton.style.background = "#d3f9d8";
    document.querySelector(`[data-side="gauche"][data-i="${selectionGauche}"]`).disabled = true;
    document.querySelector(`[data-side="gauche"][data-i="${selectionGauche}"]`).style.background = "#d3f9d8";
    pairesResolues.push(i);
    selectionGauche = null;

    if (pairesResolues.length === exercice.paires.length) {
      afficherIndiceOuReponse(exercice, true);
    } else {
      document.getElementById("exercice-feedback").innerHTML = `<p style="color:#2f9e44;">Bonne association !</p>`;
    }
  } else {
    if (tentativesExercice >= MAX_TENTATIVES) {
      exercice.paires.forEach((p, idx) => {
        document.querySelector(`[data-side="gauche"][data-i="${idx}"]`).disabled = true;
        document.querySelector(`[data-side="droite"][data-i="${idx}"]`).disabled = true;
      });
      afficherIndiceOuReponse(exercice, false);
    } else {
      afficherIndiceOuReponse(exercice, false);
    }
  }
}

function afficherRecapExercices() {
  const total = resultatsExercices.length;
  const bonnes = resultatsExercices.filter(Boolean).length;
  const enfantState = etat[profilActifId];
  enfantState.scoresLecons = enfantState.scoresLecons || {};
  enfantState.scoresLecons[leconEnCoursId] = { bonnes, total };
  saveState(etat);

  document.getElementById("recap-score").textContent =
    total > 0 ? `Tu as ${bonnes} bonne${bonnes > 1 ? "s" : ""} réponse${bonnes > 1 ? "s" : ""} sur ${total} !` : "Pas d'exercice pour cette leçon.";
  afficherEcran("screen-recap-exercices");
}
