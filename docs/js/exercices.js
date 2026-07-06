const MAX_TENTATIVES = 3;

let exercicesEnCours = [];
let indexExercice = 0;
let tentativesExercice = 0;
let resultatsExercices = [];
let premierCoupExercice = [];
let selectionGauche = null;
let pairesResolues = [];
let permutationDroite = [];
let sequenceOrdre = [];
let poolOrdre = [];

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

const NIVEAUX_PAR_DIFFICULTE = {
  reduite: ["decouverte"],
  normale: ["decouverte", "application"],
  avancee: ["decouverte", "application", "defi"],
};

function demarrerExercices(leconId) {
  const lecon = getLecon(leconId);
  const enfantState = etat[profilActifId];
  const niveauxAutorises = NIVEAUX_PAR_DIFFICULTE[enfantState.difficulte] || NIVEAUX_PAR_DIFFICULTE.avancee;
  exercicesEnCours = (lecon.exercices || []).filter((ex) => niveauxAutorises.includes(ex.niveau));
  indexExercice = 0;
  resultatsExercices = [];
  premierCoupExercice = [];
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
  } else if (exercice.type === "ordre") {
    sequenceOrdre = [];
    poolOrdre = melanger(exercice.elements.map((e, i) => i));
    zone.innerHTML = `
      <div id="ordre-sequence" style="min-height:44px; border:2px dashed #ddd; border-radius:10px; padding:10px; margin-bottom:14px;"></div>
      <div id="ordre-pool" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;"></div>
    `;
    rendreOrdre(exercice);
  }
}

function rendreOrdre(exercice) {
  const zoneSeq = document.getElementById("ordre-sequence");
  zoneSeq.innerHTML =
    sequenceOrdre.length > 0
      ? sequenceOrdre.map((i, pos) => `<span class="ordre-sequence-item">${pos + 1}. ${exercice.elements[i]}</span>`).join("")
      : `<span style="color:#aaa;">Clique les étapes ci-dessous dans le bon ordre...</span>`;
  const zonePool = document.getElementById("ordre-pool");
  zonePool.innerHTML = poolOrdre.map((i) => `<button class="ordre-etiquette" data-ordre-i="${i}">${exercice.elements[i]}</button>`).join("");
  zonePool.querySelectorAll("[data-ordre-i]").forEach((bouton) => {
    bouton.addEventListener("click", () => cliquerOrdre(exercice, parseInt(bouton.dataset.ordreI, 10)));
  });
}

function cliquerOrdre(exercice, i) {
  sequenceOrdre.push(i);
  poolOrdre = poolOrdre.filter((x) => x !== i);

  if (poolOrdre.length > 0) {
    rendreOrdre(exercice);
    return;
  }

  tentativesExercice++;
  const correct = sequenceOrdre.every((valeur, position) => valeur === position);
  afficherIndiceOuReponse(exercice, correct);
  if (!correct && tentativesExercice < MAX_TENTATIVES) {
    sequenceOrdre = [];
    poolOrdre = melanger(exercice.elements.map((e, idx) => idx));
    rendreOrdre(exercice);
  } else {
    document.querySelectorAll("#ordre-pool [data-ordre-i]").forEach((b) => (b.disabled = true));
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
    const points = POINTS_PAR_NIVEAU[exercice.niveau] || 10;
    const enfantState = etat[profilActifId];
    enfantState.points += points;
    saveState(etat);

    resultatsExercices.push(true);
    premierCoupExercice.push(tentativesExercice === 1);
    feedback.innerHTML = `<p style="color:#2f9e44; font-weight:bold;">Bravo, c'est la bonne réponse ! (+${points} points)</p><p>${exercice.explication}</p>`;
    afficherBoutonSuivantExercice();
    return;
  }

  if (tentativesExercice < MAX_TENTATIVES) {
    const indice = exercice.indices[Math.min(tentativesExercice - 1, exercice.indices.length - 1)];
    feedback.innerHTML = `<p style="color:#e0574c;">Pas tout à fait ! Indice : ${indice}</p>`;
  } else {
    resultatsExercices.push(false);
    premierCoupExercice.push(false);
    feedback.innerHTML = `<p style="color:#e0574c; font-weight:bold;">La bonne réponse était : ${resumeReponse(exercice)}</p><p>${exercice.explication}</p>`;
    afficherBoutonSuivantExercice();
  }
}

function resumeReponse(exercice) {
  if (exercice.type === "saisie") return exercice.reponsesAcceptees[0];
  if (exercice.type === "zone") return exercice.zoneCorrecte;
  if (exercice.type === "association") return exercice.paires.map((p) => `${p.gauche} → ${p.droite}`).join(", ");
  if (exercice.type === "ordre") return exercice.elements.join(" → ");
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

  const sansFaute = total > 0 && resultatsExercices.every(Boolean) && premierCoupExercice.every(Boolean);
  enfantState.leconsSansFauteIds = enfantState.leconsSansFauteIds || [];
  if (sansFaute && !enfantState.leconsSansFauteIds.includes(leconEnCoursId)) {
    enfantState.leconsSansFauteIds.push(leconEnCoursId);
  }
  saveState(etat);

  document.getElementById("recap-score").textContent =
    total > 0 ? `Tu as ${bonnes} bonne${bonnes > 1 ? "s" : ""} réponse${bonnes > 1 ? "s" : ""} sur ${total} !${sansFaute ? " Sans faute, bravo !" : ""}` : "Pas d'exercice pour cette leçon.";
  afficherEcran("screen-recap-exercices");
}
