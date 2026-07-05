# Lancer l'app avec la synchronisation Google Drive

## 1. Lancer le serveur

Il faut avoir [Node.js](https://nodejs.org) installé sur le PC (une seule fois). Ensuite, à chaque fois que tu veux lancer l'app :

```
node server/server.js
```

Puis ouvre `http://localhost:5173` dans ton navigateur.

Si tu ne veux pas la synchronisation Drive, tu peux toujours lancer l'app comme avant (`python3 -m http.server` dans le dossier `app/`) — tout le reste fonctionne pareil, seule la synchro sera indisponible.

## 2. Créer tes identifiants Google (à faire une seule fois)

Cette étape doit être faite par toi car elle nécessite ton propre compte Google. Ça prend environ 5 minutes :

1. Va sur [console.cloud.google.com](https://console.cloud.google.com/) et connecte-toi avec ton compte Google.
2. Crée un nouveau projet (nom libre, par exemple "Parcours CM1").
3. Dans le menu, va dans **APIs & Services > Library**, cherche "Google Drive API" et clique sur **Enable** (activer).
4. Va dans **APIs & Services > OAuth consent screen** :
   - Type d'utilisateur : **External**.
   - Remplis le nom de l'app (ex. "Parcours CM1"), ton email, et valide.
   - À l'étape "Test users" (utilisateurs de test), ajoute ton adresse email (celle que tu utilises pour Google Drive). C'est important : tant que l'app n'est pas "publiée", seuls les emails ajoutés ici peuvent se connecter.
5. Va dans **APIs & Services > Credentials**, clique sur **Create Credentials > OAuth client ID** :
   - Type d'application : **Desktop app**.
   - Nom libre (ex. "Parcours CM1 - PC maison").
   - Valide : Google t'affiche un **Client ID** et un **Client Secret**.
6. Copie `server/config.example.json` vers `server/config.json` (ce fichier ne sera jamais envoyé sur GitHub), et colle ton Client ID et ton Client Secret dedans :

```json
{
  "clientId": "xxxxxxxx.apps.googleusercontent.com",
  "clientSecret": "xxxxxxxx"
}
```

7. Relance le serveur (`node server/server.js`).

## 3. Connecter Google Drive dans l'app

Dans l'app, ouvre l'**espace parent** (code par défaut `1234`), puis la section **Synchronisation Google Drive**, et clique sur **Connecter Google Drive**. Une page Google s'ouvre pour te demander l'autorisation — accepte, puis reviens dans l'app.

La sauvegarde se fait automatiquement en arrière-plan dès que l'appareil est en ligne. En cas de doute, un bouton **Forcer une synchronisation** est disponible dans le tableau de bord parent.

## Sécurité

- `server/config.json` et `server/tokens.json` contiennent des informations propres à ton compte Google : ils sont exclus de git (`.gitignore`) et ne doivent jamais être partagés.
- La progression est stockée dans un dossier spécial et invisible de ton Google Drive classique (`appDataFolder`), réservé à cette application.
