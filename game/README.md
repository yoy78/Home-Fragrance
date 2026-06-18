# Arcade Shooter

Jeu de tir vertical (shoot 'em up) développé avec **Phaser 3** et **TypeScript**.

## Lancer le jeu

```bash
cd game
npm install
npm run dev
```

Ouvrez ensuite `http://localhost:3000` dans votre navigateur.

## Contrôles

| Touche | Action |
|--------|--------|
| ← → | Déplacer le vaisseau horizontalement |
| ↑ ↓ | Déplacer le vaisseau verticalement |
| Espace | Tirer |

## Ennemis

| Type | Couleur | Points | Comportement |
|------|---------|--------|--------------|
| Basique | Rouge | 10 | Descend tout droit |
| Zigzag | Orange | 20 | Mouvement sinusoïdal |
| Tireur | Violet | 30 | Tire des projectiles |

## Powerups

| Powerup | Couleur | Effet |
|---------|---------|-------|
| Bouclier | Cyan | Invincibilité temporaire |
| Tir rapide | Orange | Cadence de tir x3 |
| Tir dispersé | Violet | 3 projectiles simultanés |

## Progression

- Chaque niveau requiert 20 × niveau ennemis détruits
- La difficulté augmente (+20% vitesse/fréquence) à chaque niveau

## Build

```bash
npm run build
```

Les fichiers de production sont dans `dist/`.
