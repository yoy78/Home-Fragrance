const POINTS_PAR_NIVEAU = { decouverte: 10, application: 15, defi: 25 };

function evaluerNouveauxBadges(enfantState) {
  const nouveaux = [];
  BADGES.forEach((b) => {
    if (!enfantState.badges.includes(b.id) && b.condition(enfantState)) {
      enfantState.badges.push(b.id);
      nouveaux.push(b);
    }
  });
  return nouveaux;
}
