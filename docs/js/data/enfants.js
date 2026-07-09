const ENFANTS = [
  {
    id: "adele",
    prenom: "Adèle",
    mascotte: "chat",
    emoji: "🐱",
    emojiPaliers: ["🐾", "🐱", "😼", "🐯", "🦁👑"],
    nomPaliers: ["Empreintes mystérieuses", "Chaton joueur", "Chat malicieux", "Tigre agile", "Lion Roi de la Savane"],
    couleur: "#ff8fab",
    couleurClair: "#ffe3ec",
  },
  {
    id: "matys",
    prenom: "Matys",
    mascotte: "serpent",
    emoji: "🐍",
    emojiPaliers: ["🥚", "🐍", "🐍✨", "🐲", "🐉🔥"],
    nomPaliers: ["Œuf mystérieux", "Serpenteau curieux", "Serpent charmeur", "Dragonnet", "Dragon Légendaire"],
    couleur: "#6fcf97",
    couleurClair: "#e3f9ec",
  },
];

function getEnfant(id) {
  return ENFANTS.find((e) => e.id === id) || null;
}
