const STORAGE_KEY = "cm1app_state_v1";
const PALIERS_POINTS = [0, 50, 150, 300, 500];

function defaultEnfantState() {
  return {
    points: 0,
    palier: 0,
    badges: [],
    derniereConnexion: null,
    leconsCompletees: [],
    derniereLeconId: null,
    leconsSansFauteIds: [],
    scoresLecons: {},
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { adele: defaultEnfantState(), matys: defaultEnfantState(), dernierProfil: null };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      adele: { ...defaultEnfantState(), ...(parsed.adele || {}) },
      matys: { ...defaultEnfantState(), ...(parsed.matys || {}) },
      dernierProfil: parsed.dernierProfil || null,
    };
  } catch (e) {
    return { adele: defaultEnfantState(), matys: defaultEnfantState(), dernierProfil: null };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calculerPalier(points) {
  let palier = 0;
  for (let i = 0; i < PALIERS_POINTS.length; i++) {
    if (points >= PALIERS_POINTS[i]) palier = i;
  }
  return palier;
}

function pointsAvantProchainPalier(points) {
  const palier = calculerPalier(points);
  if (palier >= PALIERS_POINTS.length - 1) return null;
  return PALIERS_POINTS[palier + 1] - points;
}
