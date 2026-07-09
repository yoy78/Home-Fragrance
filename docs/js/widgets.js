function toggleCircuitWidget(interrupteur) {
  const svg = interrupteur.closest("svg");
  const ferme = interrupteur.dataset.ferme === "true";
  const nouvelEtat = !ferme;
  interrupteur.dataset.ferme = String(nouvelEtat);

  const tigeOuverte = svg.querySelector('[data-role="tige-ouverte"]');
  const tigeFermee = svg.querySelector('[data-role="tige-fermee"]');
  const ampoule = svg.querySelector('[data-role="ampoule"]');
  const fil = svg.querySelectorAll('[data-role="fil"]');
  const statut = svg.querySelector('[data-role="statut"]');

  if (tigeOuverte) tigeOuverte.style.display = nouvelEtat ? "none" : "inline";
  if (tigeFermee) tigeFermee.style.display = nouvelEtat ? "inline" : "none";

  if (ampoule) {
    ampoule.setAttribute("fill", nouvelEtat ? "#ffd166" : "#f0f0f0");
    ampoule.classList.toggle("widget-ampoule-allumee", nouvelEtat);
  }
  fil.forEach((f) => f.classList.toggle("widget-fil-actif", nouvelEtat));
  if (statut) statut.textContent = nouvelEtat ? "Circuit fermé : ça marche !" : "Circuit ouvert : clique l'interrupteur !";
}

function changerEtatMatiere(bouton, nouvelEtat) {
  const svg = bouton.closest("svg");
  svg.querySelectorAll(".widget-etat-groupe").forEach((g) => {
    g.style.opacity = g.dataset.etat === nouvelEtat ? "1" : "0";
  });
  svg.querySelectorAll("[data-role='bouton-etat']").forEach((b) => {
    b.setAttribute("fill", b.dataset.etat === nouvelEtat ? "#ffd166" : "#fff8e7");
  });
  const legende = svg.querySelector('[data-role="legende-etat"]');
  const libelles = { solide: "Solide : glace 🧊", liquide: "Liquide : eau 💧", gazeux: "Gazeux : vapeur ☁️" };
  if (legende) legende.textContent = libelles[nouvelEtat] || "";
}

function afficherInfobulleTimeline(point, texte) {
  const svg = point.closest("svg");
  const bulleTexte = svg.querySelector('[data-role="infobulle-texte"]');
  const bulleFond = svg.querySelector('[data-role="infobulle-fond"]');
  if (!bulleTexte || !bulleFond) return;

  const dejaAffiche = bulleFond.style.display !== "none" && bulleTexte.dataset.texteActuel === texte;
  if (dejaAffiche) {
    bulleFond.style.display = "none";
    bulleTexte.style.display = "none";
    return;
  }

  bulleTexte.dataset.texteActuel = texte;
  bulleTexte.innerHTML = "";
  bulleFond.style.display = "block";
  bulleTexte.style.display = "block";

  const largeurBoite = parseFloat(bulleFond.getAttribute("width"));
  const maxLargeurTexte = largeurBoite - 20;
  const centreX = parseFloat(bulleFond.getAttribute("x")) + largeurBoite / 2;
  const svgNS = "http://www.w3.org/2000/svg";

  const mesureur = document.createElementNS(svgNS, "tspan");
  mesureur.setAttribute("x", centreX);
  mesureur.style.visibility = "hidden";
  bulleTexte.appendChild(mesureur);

  const mots = texte.split(" ");
  const lignes = [];
  let ligneCourante = "";
  mots.forEach((mot) => {
    const essai = ligneCourante ? `${ligneCourante} ${mot}` : mot;
    mesureur.textContent = essai;
    if (mesureur.getComputedTextLength() > maxLargeurTexte && ligneCourante) {
      lignes.push(ligneCourante);
      ligneCourante = mot;
    } else {
      ligneCourante = essai;
    }
  });
  if (ligneCourante) lignes.push(ligneCourante);
  mesureur.remove();

  const hauteurLigne = 13;
  const hauteurBoite = Math.max(40, lignes.length * hauteurLigne + 22);
  bulleFond.setAttribute("height", hauteurBoite);

  const yDepart = parseFloat(bulleFond.getAttribute("y")) + (hauteurBoite - lignes.length * hauteurLigne) / 2 + 8;
  lignes.forEach((ligne, i) => {
    const tspan = document.createElementNS(svgNS, "tspan");
    tspan.setAttribute("x", centreX);
    tspan.setAttribute("y", yDepart + i * hauteurLigne);
    tspan.textContent = ligne;
    bulleTexte.appendChild(tspan);
  });

  bulleFond.classList.remove("widget-infobulle-visible");
  bulleTexte.classList.remove("widget-infobulle-visible");
  void bulleFond.getBBox();
  bulleFond.classList.add("widget-infobulle-visible");
  bulleTexte.classList.add("widget-infobulle-visible");
}

function inclinerDroite(bouton) {
  const svg = bouton.closest("svg");
  const groupe = svg.querySelector('[data-role="droite-mobile"]');
  const statut = svg.querySelector('[data-role="statut-angle"]');
  const marques = svg.querySelectorAll('[data-role="angle-droit-marque"]');
  if (!groupe) return;

  let angle = parseInt(groupe.dataset.angle || "0", 10);
  angle = (angle + 30) % 180;
  groupe.dataset.angle = String(angle);
  const cx = groupe.dataset.cx;
  const cy = groupe.dataset.cy;
  groupe.setAttribute("transform", `rotate(${angle} ${cx} ${cy})`);

  const perpendiculaire = angle === 0;
  marques.forEach((m) => (m.style.display = perpendiculaire ? "inline" : "none"));
  if (statut) {
    statut.textContent = perpendiculaire
      ? "(d3) est perpendiculaire à (d1) et (d2) : angle droit !"
      : `(d3) est inclinée de ${angle}° : ce n'est plus un angle droit.`;
    statut.setAttribute("fill", perpendiculaire ? "#2f9e44" : "#e0574c");
  }
}

function basculerVueMesure(bouton, mode) {
  const svg = bouton.closest("svg");
  const contour = svg.querySelector('[data-role="mesure-perimetre"]');
  const remplissage = svg.querySelector('[data-role="mesure-aire"]');
  const legende = svg.querySelector('[data-role="mesure-legende"]');
  svg.querySelectorAll('[data-role="mesure-bouton"]').forEach((b) => {
    b.setAttribute("fill", b.dataset.mode === mode ? "#ffd166" : "#fff8e7");
  });
  if (contour) contour.style.opacity = mode === "perimetre" ? "1" : "0";
  if (remplissage) remplissage.style.opacity = mode === "aire" ? "1" : "0";
  if (legende) {
    legende.textContent =
      mode === "perimetre"
        ? "Le périmètre : la longueur du contour (les 4 côtés)"
        : "L'aire : la surface couverte (l'intérieur)";
  }
}

function allumerCourantWidget(bouton) {
  const svg = bouton.closest("svg");
  const allume = bouton.dataset.allume === "true";
  const nouvelEtat = !allume;
  bouton.dataset.allume = String(nouvelEtat);
  const label = svg.querySelector('[data-role="bouton-courant-label"]');
  if (label) label.textContent = nouvelEtat ? "Éteindre le courant" : "Allumer le courant";

  svg.querySelectorAll('[data-role="cable-electrique"]').forEach((c) => c.classList.toggle("widget-fil-actif", nouvelEtat));
  const maison = svg.querySelector('[data-role="maison-lumiere"]');
  if (maison) {
    maison.setAttribute("fill", nouvelEtat ? "#ffd166" : "#f0f0f0");
    maison.classList.toggle("widget-ampoule-allumee", nouvelEtat);
  }
}

function distribuerDivisionWidget(part) {
  const svg = part.closest("svg");
  const compteur = svg.querySelector('[data-role="compteur-parts"]');
  const dejaFait = part.dataset.distribue === "true";
  part.dataset.distribue = String(!dejaFait);
  part.setAttribute("fill-opacity", dejaFait ? "0.35" : "1");

  if (compteur) {
    const total = svg.querySelectorAll('[data-role="part-quotient"]').length;
    const faites = [...svg.querySelectorAll('[data-role="part-quotient"]')].filter(
      (p) => p.dataset.distribue === "true"
    ).length;
    compteur.textContent = `${faites} / ${total} parts distribuées`;
  }
}
