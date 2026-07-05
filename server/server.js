const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5173;
const APP_DIR = path.join(__dirname, "..", "app");
const CONFIG_PATH = path.join(__dirname, "config.json");
const TOKENS_PATH = path.join(__dirname, "tokens.json");
const REDIRECT_URI = `http://localhost:${PORT}/oauth/callback`;
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const BACKUP_FILENAME = "cm1app-progression.json";

function chargerConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    return null;
  }
}

function chargerTokens() {
  if (!fs.existsSync(TOKENS_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKENS_PATH, "utf8"));
  } catch (e) {
    return null;
  }
}

function sauvegarderTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

async function rafraichirAccessTokenSiBesoin(tokens, config) {
  if (tokens.expiryTimestamp && tokens.expiryTimestamp > Date.now() + 60000) {
    return tokens;
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: tokens.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error("Échec du rafraîchissement du token : " + JSON.stringify(data));
  tokens.accessToken = data.access_token;
  tokens.expiryTimestamp = Date.now() + data.expires_in * 1000;
  sauvegarderTokens(tokens);
  return tokens;
}

async function trouverOuCreerFichierBackup(tokens) {
  if (tokens.fileId) return tokens.fileId;

  const rechercheRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(`name='${BACKUP_FILENAME}'`)}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${tokens.accessToken}` } }
  );
  const rechercheData = await rechercheRes.json();
  if (rechercheData.files && rechercheData.files.length > 0) {
    tokens.fileId = rechercheData.files[0].id;
    sauvegarderTokens(tokens);
    return tokens.fileId;
  }

  const creationRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${tokens.accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: BACKUP_FILENAME, parents: ["appDataFolder"] }),
  });
  const creationData = await creationRes.json();
  if (!creationRes.ok) throw new Error("Échec de création du fichier Drive : " + JSON.stringify(creationData));
  tokens.fileId = creationData.id;
  sauvegarderTokens(tokens);
  return tokens.fileId;
}

function envoyerJSON(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function envoyerHTML(res, status, html) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function pageSimple(titre, message, lien) {
  return `<!doctype html><html lang="fr"><head><meta charset="UTF-8"><title>${titre}</title>
  <style>body{font-family:sans-serif;text-align:center;padding:60px 20px;background:#fff8e7;}
  a{display:inline-block;margin-top:20px;padding:12px 24px;background:#ffd166;border-radius:999px;text-decoration:none;color:#2d2a4a;font-weight:bold;}</style>
  </head><body><h1>${titre}</h1><p>${message}</p>${lien ? `<a href="/">Retour à l'application</a>` : ""}</body></html>`;
}

const TYPES_MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

function servirFichierStatique(req, res, pathname) {
  let chemin = pathname === "/" ? "/index.html" : pathname;
  const chemFichier = path.join(APP_DIR, chemin);
  if (!chemFichier.startsWith(APP_DIR)) {
    res.writeHead(403);
    res.end("Interdit");
    return;
  }
  fs.readFile(chemFichier, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Introuvable");
      return;
    }
    const ext = path.extname(chemFichier);
    res.writeHead(200, { "Content-Type": TYPES_MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function lireCorps(req) {
  return new Promise((resolve, reject) => {
    let corps = "";
    req.on("data", (chunk) => (corps += chunk));
    req.on("end", () => resolve(corps));
    req.on("error", reject);
  });
}

const serveur = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === "/oauth/start") {
    const config = chargerConfig();
    if (!config || !config.clientId) {
      envoyerHTML(res, 200, pageSimple(
        "Configuration manquante",
        "Le fichier <code>server/config.json</code> n'existe pas encore ou ne contient pas d'identifiant Google (clientId). Suis les instructions de configuration avant de connecter Google Drive.",
        true
      ));
      return;
    }
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: DRIVE_SCOPE,
      access_type: "offline",
      prompt: "consent",
    });
    res.writeHead(302, { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
    res.end();
    return;
  }

  if (url.pathname === "/oauth/callback") {
    const code = url.searchParams.get("code");
    const erreur = url.searchParams.get("error");
    if (erreur) {
      envoyerHTML(res, 200, pageSimple("Connexion annulée", `Google a renvoyé une erreur : ${erreur}.`, true));
      return;
    }
    const config = chargerConfig();
    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: REDIRECT_URI,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(JSON.stringify(tokenData));
      sauvegarderTokens({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiryTimestamp: Date.now() + tokenData.expires_in * 1000,
        fileId: null,
      });
      envoyerHTML(res, 200, pageSimple("Connecté !", "Google Drive est maintenant connecté. Tu peux retourner à l'application.", true));
    } catch (e) {
      envoyerHTML(res, 200, pageSimple("Erreur de connexion", `Une erreur est survenue lors de la connexion à Google : ${e.message}`, true));
    }
    return;
  }

  if (url.pathname === "/api/drive/status") {
    const config = chargerConfig();
    const tokens = chargerTokens();
    envoyerJSON(res, 200, { configure: !!(config && config.clientId), connecte: !!(tokens && tokens.refreshToken) });
    return;
  }

  if (url.pathname === "/api/drive/disconnect" && req.method === "POST") {
    if (fs.existsSync(TOKENS_PATH)) fs.unlinkSync(TOKENS_PATH);
    envoyerJSON(res, 200, { ok: true });
    return;
  }

  if (url.pathname === "/api/drive/backup" && req.method === "POST") {
    try {
      const config = chargerConfig();
      let tokens = chargerTokens();
      if (!config || !tokens) return envoyerJSON(res, 400, { erreur: "Google Drive non connecté." });
      tokens = await rafraichirAccessTokenSiBesoin(tokens, config);
      const fileId = await trouverOuCreerFichierBackup(tokens);
      const corps = await lireCorps(req);
      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${tokens.accessToken}`, "Content-Type": "application/json" },
        body: corps,
      });
      if (!uploadRes.ok) throw new Error(await uploadRes.text());
      envoyerJSON(res, 200, { ok: true });
    } catch (e) {
      envoyerJSON(res, 500, { erreur: e.message });
    }
    return;
  }

  if (url.pathname === "/api/drive/restore") {
    try {
      const config = chargerConfig();
      let tokens = chargerTokens();
      if (!config || !tokens) return envoyerJSON(res, 400, { erreur: "Google Drive non connecté." });
      tokens = await rafraichirAccessTokenSiBesoin(tokens, config);
      const fileId = await trouverOuCreerFichierBackup(tokens);
      const contenuRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (contenuRes.status === 404 || contenuRes.headers.get("content-length") === "0") {
        return envoyerJSON(res, 200, { etat: null });
      }
      const texte = await contenuRes.text();
      if (!texte) return envoyerJSON(res, 200, { etat: null });
      envoyerJSON(res, 200, { etat: JSON.parse(texte) });
    } catch (e) {
      envoyerJSON(res, 500, { erreur: e.message });
    }
    return;
  }

  if (req.method === "GET") {
    servirFichierStatique(req, res, url.pathname);
    return;
  }

  res.writeHead(404);
  res.end("Introuvable");
});

serveur.listen(PORT, () => {
  console.log(`Serveur démarré : http://localhost:${PORT}`);
  if (!chargerConfig()) {
    console.log("Astuce : server/config.json n'existe pas encore — voir server/README.md pour connecter Google Drive.");
  }
});
