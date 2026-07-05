const DATE_LIMITE_MODE_LIBRE = new Date("2026-07-19T00:00:00");

function estModeLibre() {
  return new Date() >= DATE_LIMITE_MODE_LIBRE;
}

function leconsRestantes(enfantState) {
  return LECONS.filter((l) => !enfantState.leconsCompletees.includes(l.id));
}

function prochaineLecon(enfantState) {
  const restantes = leconsRestantes(enfantState);
  return restantes.length ? restantes[0] : null;
}

function alternativesLecon(enfantState, n = 2) {
  const restantes = leconsRestantes(enfantState);
  return restantes.slice(1, 1 + n);
}

function leconEchauffement(enfantState) {
  if (!enfantState.derniereLeconId) return null;
  return getLecon(enfantState.derniereLeconId);
}

function marquerLeconCompletee(enfantState, leconId) {
  if (!enfantState.leconsCompletees.includes(leconId)) {
    enfantState.leconsCompletees.push(leconId);
  }
  enfantState.derniereLeconId = leconId;
}
