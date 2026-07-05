const PARENT_PIN = "1234";

let etat = loadState();
let profilActifId = null;
let leconEnCoursId = null;
let indexQuestionEchauffement = 0;
let palierAuDebutLecon = 0;
let debutLeconTimestamp = 0;
let profilDashboard = null;

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

  const palierActuel = calculerPalier(enfantState.points);
  document.getElementById("mascotte-grande").textContent = enfant.emojiPaliers[palierActuel];
  document.getElementById("mascotte-points").textContent = `${enfantState.points} points`;

  const restant = pointsAvantProchainPalier(enfantState.points);
  const barre = document.getElementById("barre-progression-remplie");
  if (restant === null) {
    barre.style.width = "100%";
    document.getElementById("mascotte-prochain-palier").textContent =
      "Palier maximum atteint pour l'instant !";
  } else {
    const palierActuelSeuil = PALIERS_POINTS[palierActuel];
    const palierSuivantSeuil = PALIERS_POINTS[palierActuel + 1];
    const progression =
      ((enfantState.points - palierActuelSeuil) / (palierSuivantSeuil - palierActuelSeuil)) * 100;
    barre.style.width = `${Math.max(0, Math.min(100, progression))}%`;
    document.getElementById("mascotte-prochain-palier").textContent =
      `Encore ${restant} points avant la prochaine évolution !`;
  }

  rendreOngletAccueil();
  rendreOngletParcours();
  rendreOngletBadges();
  changerOnglet("accueil");
  afficherEcran("screen-accueil");
}

function rendreOngletBadges() {
  const enfantState = etat[profilActifId];
  const conteneur = document.getElementById("contenu-badges");
  const lignes = BADGES.map((b) => {
    const debloque = enfantState.badges.includes(b.id);
    return `
      <div style="display:flex; align-items:center; gap:12px; padding:10px; border-bottom: 1px solid #eee; text-align:left; opacity:${debloque ? "1" : "0.4"};">
        <span style="font-size:1.8rem;">${debloque ? b.emoji : "🔒"}</span>
        <div>
          <div style="font-weight:bold;">${b.nom}</div>
          <div style="font-size:0.85rem; color:#7a7599;">${b.description}</div>
        </div>
      </div>
    `;
  }).join("");
  const nbDebloques = enfantState.badges.length;
  conteneur.innerHTML = `<h2>Mes badges (${nbDebloques}/${BADGES.length})</h2><div>${lignes}</div>`;
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
  palierAuDebutLecon = calculerPalier(enfantState.points);
  debutLeconTimestamp = Date.now();
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
  const lecon = getLecon(leconEnCoursId);
  const dureeSecondes = Math.max(1, Math.round((Date.now() - debutLeconTimestamp) / 1000));
  const score = enfantState.scoresLecons[leconEnCoursId] || { bonnes: 0, total: 0 };
  enfantState.journal.push({
    date: new Date().toISOString().slice(0, 10),
    leconId: leconEnCoursId,
    matiere: lecon.matiere,
    dureeSecondes,
    bonnes: score.bonnes,
    total: score.total,
  });
  marquerLeconCompletee(enfantState, leconEnCoursId);
  const nouveauxBadges = evaluerNouveauxBadges(enfantState);
  const palierApres = calculerPalier(enfantState.points);
  const evolutionMascotte = palierApres > palierAuDebutLecon;
  saveState(etat);
  leconEnCoursId = null;

  if (nouveauxBadges.length > 0 || evolutionMascotte) {
    afficherCelebration(nouveauxBadges, evolutionMascotte);
  } else {
    afficherAccueil();
  }
}

function afficherCelebration(nouveauxBadges, evolutionMascotte) {
  const enfant = getEnfant(profilActifId);
  const enfantState = etat[profilActifId];
  const palierActuel = calculerPalier(enfantState.points);
  let html = "";

  if (evolutionMascotte) {
    html += `
      <div style="font-size: 4rem;">${enfant.emojiPaliers[palierActuel]}</div>
      <p style="font-weight: bold; font-size: 1.2rem;">Ta mascotte a évolué !</p>
    `;
  }

  if (nouveauxBadges.length > 0) {
    html += `<p style="font-weight: bold;">Nouveau${nouveauxBadges.length > 1 ? "x" : ""} badge${nouveauxBadges.length > 1 ? "s" : ""} débloqué${nouveauxBadges.length > 1 ? "s" : ""} :</p>`;
    html += nouveauxBadges
      .map((b) => `<div style="margin: 8px 0;"><span style="font-size: 1.6rem;">${b.emoji}</span> <strong>${b.nom}</strong> — ${b.description}</div>`)
      .join("");
  }

  document.getElementById("celebration-contenu").innerHTML = html;
  afficherEcran("screen-celebration");
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
    afficherTableauBordParent();
  } else {
    document.getElementById("pin-erreur").textContent = "Code incorrect, réessaie.";
  }
}

function afficherTableauBordParent() {
  profilDashboard = profilDashboard || profilActifId || ENFANTS[0].id;
  rendreTableauBordParent();
  afficherEcran("screen-parent-dashboard");
}

function rendreTableauBordParent() {
  const enfant = getEnfant(profilDashboard);
  const enfantState = etat[profilDashboard];
  const conteneur = document.getElementById("parent-dashboard-contenu");

  let html = `<div style="display:flex; gap:10px; justify-content:center; margin-bottom:20px;">`;
  ENFANTS.forEach((e) => {
    html += `<button class="onglet ${e.id === profilDashboard ? "actif" : ""}" data-dash-enfant="${e.id}">${e.emoji} ${e.prenom}</button>`;
  });
  html += `</div>`;

  const palierActuel = calculerPalier(enfantState.points);
  html += `<div class="contenu-onglet" style="margin-bottom:20px;">
    <h2>${enfant.emoji} ${enfant.prenom}</h2>
    <p>${enfantState.points} points — mascotte : ${enfant.emojiPaliers[palierActuel]} (palier ${palierActuel + 1}/${enfant.emojiPaliers.length})</p>
    <p>${enfantState.leconsCompletees.length} / ${LECONS.length} leçons terminées — ${enfantState.badges.length} / ${BADGES.length} badges débloqués</p>
  </div>`;

  html += `<div class="contenu-onglet" style="margin-bottom:20px; text-align:left;"><h3 style="text-align:center;">Progression par matière</h3>`;
  Object.keys(MATIERES).forEach((idMatiere) => {
    const total = LECONS.filter((l) => l.matiere === idMatiere).length;
    const faites = LECONS.filter((l) => l.matiere === idMatiere && enfantState.leconsCompletees.includes(l.id)).length;
    const m = MATIERES[idMatiere];
    html += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee;"><span>${m.emoji} ${m.nom}</span><span>${faites} / ${total}</span></div>`;
  });
  html += `</div>`;

  const parJour = {};
  enfantState.journal.forEach((j) => {
    parJour[j.date] = (parJour[j.date] || 0) + j.dureeSecondes;
  });
  const joursTries = Object.keys(parJour).sort().reverse();
  const tempsTotalMin = Math.round(enfantState.journal.reduce((s, j) => s + j.dureeSecondes, 0) / 60);
  html += `<div class="contenu-onglet" style="margin-bottom:20px; text-align:left;"><h3 style="text-align:center;">Temps passé (total : ${tempsTotalMin} min)</h3>`;
  if (joursTries.length === 0) {
    html += `<p>Aucune séance enregistrée pour l'instant.</p>`;
  } else {
    joursTries.forEach((jour) => {
      html += `<div style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee;"><span>${jour}</span><span>${Math.round(parJour[jour] / 60)} min</span></div>`;
    });
  }
  html += `</div>`;

  const leconsDifficiles = Object.entries(enfantState.scoresLecons).filter(([, s]) => s.total > 0 && s.bonnes < s.total);
  html += `<div class="contenu-onglet" style="margin-bottom:20px; text-align:left;"><h3 style="text-align:center;">Notions à retravailler</h3>`;
  if (leconsDifficiles.length === 0) {
    html += `<p>Aucune erreur récurrente détectée pour l'instant, bravo !</p>`;
  } else {
    leconsDifficiles.forEach(([id, s]) => {
      const l = getLecon(id);
      html += `<div style="padding:6px 0; border-bottom:1px solid #eee;">${MATIERES[l.matiere].emoji} ${l.titre} — ${s.bonnes}/${s.total} bonnes réponses</div>`;
    });
  }
  html += `</div>`;

  html += `<div class="contenu-onglet" style="margin-bottom:20px; text-align:left;"><h3 style="text-align:center;">Badges débloqués</h3>`;
  if (enfantState.badges.length === 0) {
    html += `<p>Aucun badge débloqué pour l'instant.</p>`;
  } else {
    enfantState.badges.forEach((id) => {
      const b = getBadge(id);
      html += `<div style="padding:6px 0; border-bottom:1px solid #eee;">${b.emoji} <strong>${b.nom}</strong></div>`;
    });
  }
  html += `</div>`;

  html += `<div class="contenu-onglet" style="margin-bottom:20px;">
    <h3>Réglage de la difficulté</h3>
    <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
      ${["reduite", "normale", "avancee"]
        .map(
          (d) =>
            `<button class="onglet ${enfantState.difficulte === d ? "actif" : ""}" data-difficulte="${d}">${{ reduite: "Réduite", normale: "Normale", avancee: "Avancée" }[d]}</button>`
        )
        .join("")}
    </div>
  </div>`;

  html += `<div class="contenu-onglet" style="margin-bottom:20px;">
    <h3>Sauvegarde et transfert entre appareils</h3>
    <p style="font-size: 0.9rem; color: #7a7599;">Pour retrouver la même progression sur un autre appareil (PC, tablette, smartphone) : exporte ici, dépose le résultat dans ton Google Drive (ou envoie-le toi-même par email), puis importe-le sur l'autre appareil.</p>
    <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
      <button class="bouton" id="bouton-exporter-sauvegarde">📥 Exporter ma progression</button>
      <button class="bouton discret" id="bouton-importer-sauvegarde">📤 Importer un fichier</button>
    </div>
    <div id="zone-export-texte" style="display:none; margin-top:16px; text-align:left;">
      <p style="font-size:0.85rem; color:#7a7599;">Si le téléchargement n'a pas démarré : copie ce texte et colle-le dans un fichier texte (nomme-le par exemple "progression.json").</p>
      <textarea id="texte-export" readonly style="width:100%; height:120px; font-family:monospace; font-size:0.75rem; padding:8px; border-radius:8px; border:2px solid #ddd;"></textarea>
      <button class="bouton discret" id="bouton-copier-export" style="margin-top:8px;">Copier le texte</button>
    </div>
    <p style="margin-top:16px;"><button class="bouton discret" id="bouton-toggle-import-texte" style="font-size:0.85rem;">Je n'ai pas de fichier, coller le texte à la place</button></p>
    <div id="zone-import-texte" style="display:none; text-align:left;">
      <textarea id="texte-import" placeholder="Colle ici le contenu de ta sauvegarde..." style="width:100%; height:120px; font-family:monospace; font-size:0.75rem; padding:8px; border-radius:8px; border:2px solid #ddd;"></textarea>
      <button class="bouton" id="bouton-importer-texte" style="margin-top:8px;">Importer ce texte</button>
    </div>
  </div>`;

  html += `<div class="contenu-onglet" style="text-align:left;"><h3 style="text-align:center;">Contrôle du parcours</h3>`;
  LECONS.forEach((l) => {
    const fait = enfantState.leconsCompletees.includes(l.id);
    html += `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 0; border-bottom:1px solid #eee;">
      <span>${MATIERES[l.matiere].emoji} ${l.titre} ${fait ? "✅" : ""}</span>
      <button class="bouton discret" data-parcours-action="${fait ? "refaire" : "acquise"}" data-parcours-lecon="${l.id}">${fait ? "Faire refaire" : "Marquer comme acquise"}</button>
    </div>`;
  });
  html += `</div>`;

  conteneur.innerHTML = html;

  conteneur.querySelectorAll("[data-dash-enfant]").forEach((b) =>
    b.addEventListener("click", () => {
      profilDashboard = b.dataset.dashEnfant;
      rendreTableauBordParent();
    })
  );
  conteneur.querySelectorAll("[data-difficulte]").forEach((b) =>
    b.addEventListener("click", () => {
      etat[profilDashboard].difficulte = b.dataset.difficulte;
      saveState(etat);
      rendreTableauBordParent();
    })
  );
  conteneur.querySelectorAll("[data-parcours-action]").forEach((b) =>
    b.addEventListener("click", () => {
      const leconId = b.dataset.parcoursLecon;
      const es = etat[profilDashboard];
      if (b.dataset.parcoursAction === "refaire") {
        es.leconsCompletees = es.leconsCompletees.filter((id) => id !== leconId);
        delete es.scoresLecons[leconId];
        es.leconsSansFauteIds = es.leconsSansFauteIds.filter((id) => id !== leconId);
      } else if (!es.leconsCompletees.includes(leconId)) {
        es.leconsCompletees.push(leconId);
      }
      saveState(etat);
      rendreTableauBordParent();
    })
  );

  const btnExporter = document.getElementById("bouton-exporter-sauvegarde");
  if (btnExporter) btnExporter.addEventListener("click", exporterSauvegarde);

  const btnImporter = document.getElementById("bouton-importer-sauvegarde");
  const champImport = document.getElementById("input-import-fichier");
  if (btnImporter && champImport) {
    btnImporter.addEventListener("click", () => champImport.click());
    champImport.addEventListener("change", importerSauvegarde);
  }

  const btnCopier = document.getElementById("bouton-copier-export");
  if (btnCopier) btnCopier.addEventListener("click", copierExport);

  const btnToggleImportTexte = document.getElementById("bouton-toggle-import-texte");
  if (btnToggleImportTexte) btnToggleImportTexte.addEventListener("click", basculerZoneImportTexte);

  const btnImporterTexte = document.getElementById("bouton-importer-texte");
  if (btnImporterTexte) btnImporterTexte.addEventListener("click", importerDepuisTexte);
}

function exporterSauvegarde() {
  const date = new Date().toISOString().slice(0, 10);
  const contenu = JSON.stringify(etat, null, 2);

  try {
    const blob = new Blob([contenu], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `cm1-progression-${date}.json`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
    URL.revokeObjectURL(url);
  } catch (e) {
    // Le téléchargement direct peut être bloqué selon le navigateur : la zone texte ci-dessous prend le relais.
  }

  const zone = document.getElementById("zone-export-texte");
  const texte = document.getElementById("texte-export");
  if (zone && texte) {
    texte.value = contenu;
    zone.style.display = "block";
  }
}

function copierExport() {
  const texte = document.getElementById("texte-export");
  texte.select();
  texte.setSelectionRange(0, 999999);
  let copie = false;
  try {
    document.execCommand("copy");
    copie = true;
  } catch (e) {}
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texte.value).catch(() => {});
    copie = true;
  }
  alert(copie ? "Texte copié ! Colle-le (Ctrl+V ou Cmd+V) dans un fichier texte." : "Sélectionne le texte à la main (Ctrl+C / Cmd+C), puis colle-le dans un fichier.");
}

function basculerZoneImportTexte() {
  const zone = document.getElementById("zone-import-texte");
  zone.style.display = zone.style.display === "none" ? "block" : "none";
}

function importerDepuisTexte() {
  const texte = document.getElementById("texte-import").value.trim();
  if (!texte) return;
  appliquerImport(texte);
}

function importerSauvegarde(evenement) {
  const fichier = evenement.target.files[0];
  if (!fichier) return;
  const lecteur = new FileReader();
  lecteur.onload = () => appliquerImport(lecteur.result);
  lecteur.readAsText(fichier);
  evenement.target.value = "";
}

function appliquerImport(texteJSON) {
  try {
    const nouvelEtat = JSON.parse(texteJSON);
    if (!nouvelEtat.adele || !nouvelEtat.matys) throw new Error("Format invalide");
    if (!confirm("Cela va remplacer la progression actuelle de cet appareil par celle importée. Continuer ?")) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nouvelEtat));
    etat = loadState();
    rendreTableauBordParent();
    alert("Progression importée avec succès !");
  } catch (e) {
    alert("Ce texte/fichier ne semble pas être une sauvegarde valide de l'application.");
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
  document.getElementById("bouton-continuer-celebration").addEventListener("click", afficherAccueil);
});
