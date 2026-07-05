const ENFANTS = [
  {
    id: "adele",
    prenom: "Adèle",
    mascotte: "chat",
    emoji: "🐱",
    emojiPaliers: ["🐾", "🐱", "😺", "😸", "🦁"],
    couleur: "#ff8fab",
    couleurClair: "#ffe3ec",
  },
  {
    id: "matys",
    prenom: "Matys",
    mascotte: "serpent",
    emoji: "🐍",
    emojiPaliers: ["🥚", "🐍", "🐍", "🐲", "🐉"],
    couleur: "#6fcf97",
    couleurClair: "#e3f9ec",
  },
];

function getEnfant(id) {
  return ENFANTS.find((e) => e.id === id) || null;
}
