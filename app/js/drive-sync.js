let statutDrive = { configure: false, connecte: false, indisponible: false };
let syncTimeoutId = null;

async function rafraichirStatutDrive() {
  try {
    const res = await fetch("/api/drive/status");
    if (!res.ok) throw new Error("statut indisponible");
    statutDrive = await res.json();
    statutDrive.indisponible = false;
  } catch (e) {
    statutDrive = { configure: false, connecte: false, indisponible: true };
  }
  return statutDrive;
}

function connecterDrive() {
  window.location.href = "/oauth/start";
}

async function deconnecterDrive() {
  try {
    await fetch("/api/drive/disconnect", { method: "POST" });
  } catch (e) {}
}

async function forcerSynchronisation(state) {
  try {
    const res = await fetch("/api/drive/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

async function restaurerDepuisDrive() {
  try {
    const res = await fetch("/api/drive/restore");
    const data = await res.json();
    if (data.etat) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.etat));
      return data.etat;
    }
    return null;
  } catch (e) {
    return null;
  }
}

function declencherSyncDrive(state) {
  if (!statutDrive.connecte) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  clearTimeout(syncTimeoutId);
  syncTimeoutId = setTimeout(() => {
    forcerSynchronisation(state);
  }, 1500);
}

async function verifierConflitDriveEtProposer() {
  await rafraichirStatutDrive();
  if (!statutDrive.connecte) return;
  try {
    const res = await fetch("/api/drive/restore");
    const data = await res.json();
    if (!data.etat) return;
    const localRaw = localStorage.getItem(STORAGE_KEY);
    const local = localRaw ? JSON.parse(localRaw) : null;
    const distantPlusRecent =
      !local ||
      !local.dernierEnregistrementISO ||
      (data.etat.dernierEnregistrementISO && data.etat.dernierEnregistrementISO > local.dernierEnregistrementISO);
    if (distantPlusRecent) {
      afficherBanniereConflitDrive(data.etat);
    }
  } catch (e) {
    /* hors-ligne ou non configuré, on ignore silencieusement */
  }
}

function afficherBanniereConflitDrive(etatDistant) {
  const banniere = document.getElementById("banniere-conflit-drive");
  if (!banniere) return;
  banniere.style.display = "flex";
  document.getElementById("bouton-restaurer-conflit").onclick = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(etatDistant));
    etat = loadState();
    banniere.style.display = "none";
  };
  document.getElementById("bouton-ignorer-conflit").onclick = () => {
    banniere.style.display = "none";
  };
}
