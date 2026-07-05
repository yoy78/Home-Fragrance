function matieresCouvertes(enfantState) {
  const vues = new Set(enfantState.leconsCompletees.map((id) => id.split("-")[0]));
  return vues.size;
}

const BADGES = [
  {
    id: "premiers-pas",
    nom: "Premiers pas",
    emoji: "👣",
    description: "Terminer ta toute première leçon",
    condition: (e) => e.leconsCompletees.length >= 1,
  },
  {
    id: "cinq-lecons",
    nom: "Cinq leçons",
    emoji: "🎯",
    description: "Terminer 5 leçons",
    condition: (e) => e.leconsCompletees.length >= 5,
  },
  {
    id: "semaine-complete",
    nom: "Semaine complète",
    emoji: "🗓️",
    description: "Terminer 7 leçons",
    condition: (e) => e.leconsCompletees.length >= 7,
  },
  {
    id: "explorateur",
    nom: "Explorateur des matières",
    emoji: "🧭",
    description: "Faire au moins une leçon dans chacune des 6 matières",
    condition: (e) => matieresCouvertes(e) >= 6,
  },
  {
    id: "sans-faute",
    nom: "Sans faute",
    emoji: "🌟",
    description: "Réussir tous les exercices d'une leçon du premier coup",
    condition: (e) => (e.leconsSansFauteIds || []).length >= 1,
  },
  {
    id: "as-maths",
    nom: "As des maths",
    emoji: "🔢",
    description: "Terminer une leçon de mathématiques",
    condition: (e) => e.leconsCompletees.some((id) => id.startsWith("maths")),
  },
  {
    id: "as-francais",
    nom: "As de français",
    emoji: "📖",
    description: "Terminer une leçon de français",
    condition: (e) => e.leconsCompletees.some((id) => id.startsWith("francais")),
  },
  {
    id: "as-anglais",
    nom: "As d'anglais",
    emoji: "🇬🇧",
    description: "Terminer une leçon d'anglais",
    condition: (e) => e.leconsCompletees.some((id) => id.startsWith("anglais")),
  },
  {
    id: "as-histoire",
    nom: "As d'histoire",
    emoji: "🏰",
    description: "Terminer une leçon d'histoire",
    condition: (e) => e.leconsCompletees.some((id) => id.startsWith("histoire")),
  },
  {
    id: "as-geographie",
    nom: "As de géographie",
    emoji: "🗺️",
    description: "Terminer une leçon de géographie",
    condition: (e) => e.leconsCompletees.some((id) => id.startsWith("geographie")),
  },
  {
    id: "as-sciences",
    nom: "As de sciences",
    emoji: "🔬",
    description: "Terminer une leçon de sciences",
    condition: (e) => e.leconsCompletees.some((id) => id.startsWith("sciences")),
  },
];

function getBadge(id) {
  return BADGES.find((b) => b.id === id) || null;
}
