# Spécification — Parcours pédagogique d'été CM1

Construite à partir de l'interview du 5 juillet 2026. À valider avant le début de la Phase 3 (construction itérative).

---

## 1. Vue d'ensemble

Application web locale, en français, pour préparer Adèle et Matys à l'entrée en CM1 (septembre 2026), du 5 juillet au 31 août. Deux parcours indépendants (même programme, rythme et difficulté adaptables à chacun), chacun accompagné d'une mascotte qui progresse avec l'enfant : un **chat** pour Adèle, un **serpent** pour Matys.

Contenu pédagogique : 6 matières — français, mathématiques, anglais, histoire, géographie, sciences (CM1 **et** CM2 pour les sciences, afin de donner de l'avance) — construit à partir de `cours-cm1/carte-pedagogique.md`, reformulé pour un enfant de 9-10 ans, jamais recopié tel quel des photos sources.

## 2. Calendrier et navigation

- **5 → 18 juillet** : une leçon par jour, planifiée automatiquement, matières alternées (pas 2 leçons de la même matière 2 jours de suite, sauf si un chapitre nécessite une suite immédiate).
- **À partir du 19 juillet** : mode libre — l'enfant choisit sa prochaine leçon. L'app met en avant **une suggestion principale** (suite logique du parcours) **+ 2-3 alternatives** (autres matières disponibles), sans bloquer l'accès à l'ensemble du parcours déjà déverrouillé par les prérequis.
- **Absence un jour** : aucune pénalité. Le programme n'est pas lié à des dates fixes mais à une file de leçons ; rater un jour décale simplement la suite.
- **Pas de notion de "streak"** à casser — seule la progression dans le parcours compte, pour ne pas culpabiliser en période de vacances.

## 3. Structure d'une séance

1. **Échauffement systématique** (2-3 questions rapides) : rappel express de la notion vue la veille, avant d'attaquer la nouveauté du jour — ancrage par rappel espacé.
2. **Leçon du jour**, reformulée simplement, illustrée, adaptée 9-10 ans.
3. **Exercices progressifs** : découverte → application → défi (comme demandé dans le cadrage initial), en 3 formats privilégiés (voir §5) — **pas de QCM en priorité**, sauf cas où aucun autre format n'est pertinent.
4. **Prolongement** : un contenu "pour aller plus loin" qui dépasse ce qui était dans les photos sources, offert à la fin de chaque leçon (facultatif, non bloquant).
5. Durée : **variable selon le jour** — la séance se termine quand les exercices proposés sont faits (grosso modo 15 à 45 min selon la notion), pas de minuteur imposé.
6. **Répétition espacée automatique** : au-delà de l'échauffement quotidien, l'app replanifie automatiquement une notion mal maîtrisée quelques jours plus tard dans la file de leçons, de façon transparente pour l'enfant/parent.

## 4. Correction et gestion des erreurs

- **Correction immédiate** après chaque question (pas en fin de série), avec une explication courte de la bonne réponse en cas d'erreur.
- **2 à 3 essais avec indice progressif** : après une première erreur, un indice apparaît (ex. « regarde le dénominateur ») avant de réessayer ; après le dernier essai, la bonne réponse est montrée et expliquée.
- **Correction tolérante sur les réponses saisies** : accents/majuscules non bloquants en français, tolérance orthographique légère à calibrer par type d'exercice (voir risques, §11).

## 5. Formats d'exercices (par ordre de priorité)

1. **Réponse à saisir** (texte/nombre au clavier) — format prioritaire, le plus proche de l'écrit scolaire.
2. **Glisser-déposer / association** (relier, remettre dans l'ordre, étiquettes à placer) — en complément, notamment pour la conjugaison, le vocabulaire, la chronologie.
3. **Manipulation visuelle sur schéma** (colorier une fraction, placer un point sur une droite graduée, positionner un pays/département sur une carte, replacer une date sur une frise) — prioritaire en **histoire et géographie**, fidèle aux exercices vus dans les cahiers sources.
4. **QCM** : évité par défaut, réservé aux cas où aucun des formats ci-dessus n'est pertinent.

## 6. Gamification

- **Mascotte évolutive par paliers visuels** : le chat (Adèle) et le serpent (Matys) changent d'apparence à des paliers clés (ex. chaton → jeune chat → chat stylisé adulte), débloqués en accumulant des points.
- **Points** à chaque bonne réponse (font progresser la mascotte) **+ badges thématiques** pour des jalons (10 leçons de maths, semaine complète, première leçon d'anglais, etc.).
- **Aucune visibilité croisée entre Adèle et Matys** : chacun ne voit que son propre parcours, sa mascotte, ses badges — pas de comparaison ni de compétition entre frère et sœur.

## 7. Tableau de bord parent

Espace séparé (accès distinct des profils enfants), contenant :
- Progression détaillée par matière et par enfant (fait / en cours / à venir).
- Signalement des notions avec erreurs récurrentes, pour savoir où aider ou reparler avec l'enfant.
- Temps passé par séance/jour, par enfant.
- Historique des badges/récompenses débloqués.
- **Contrôle manuel du parcours** : possibilité de forcer une leçon à refaire, sauter une notion déjà maîtrisée, ajuster la difficulté d'un enfant à la hausse ou à la baisse.

## 8. Ton et univers graphique

Interface **ludique et colorée, simple** : gros boutons, couleurs vives, mascottes animées qui réagissent (contentes, encourageantes), sans univers narratif complexe (pas de thème "carte au trésor" à gérer en plus) — priorité à la clarté et à la facilité d'évolution du contenu au fil des semaines. Utilisable au clic (PC) et au tactile (tablette).

## 9. Architecture technique (proposition)

Points de départ fixés par le cadrage initial : app **locale**, lançable simplement, **fonctionnement 100% hors-ligne** une fois lancée (contrainte forte : vacances en août), sauvegarde **persistante en fichiers locaux**, avec **synchronisation automatique Google Drive** dès que le réseau est disponible.

Proposition :
- **App web statique** (HTML/CSS/JS), sans dépendance à un serveur distant pour fonctionner — ouvrable directement dans un navigateur sur PC ou tablette, chacun avec sa propre sauvegarde locale.
- **Sauvegarde locale** : progression stockée en local sur l'appareil (fichier de sauvegarde structuré, pas seulement le cache du navigateur, pour survivre à un nettoyage de données).
- **Synchronisation Drive** : hors-ligne par défaut ; dès qu'une connexion internet est détectée, synchronisation automatique en arrière-plan vers un fichier de sauvegarde partagé sur Google Drive (connexion initiale unique via Google, à faire une fois par appareil).
- **Contenu pédagogique pré-généré**, pas généré à la volée par un modèle de langage en ligne : les leçons/exercices/prolongements sont rédigés et stockés comme données de l'app pendant la construction (Phase 3), pour garantir un fonctionnement 100% fiable hors-ligne en août, sans dépendre d'un accès internet ou d'une clé d'API au moment de l'usage par les enfants.

## 10. Contenu pédagogique de référence

Le détail matière par matière (thèmes, leçons, notions clés, prérequis CE2, prolongements) est dans `cours-cm1/carte-pedagogique.md`, validé le 5 juillet 2026. Rappels importants pour la construction :
- Les évaluations sources utilisent les prénoms « Léa » et « Sasha » (enfants d'une autre famille) — **ne jamais réutiliser ces noms** dans l'app.
- Sciences : peu de matière première photographiée (4 évaluations CM1), le programme CM2 devra être construit principalement à partir du programme officiel.
- Anglais : bon volume de matière (38 photos, Units 1-8 + lecture suivie *White Fang* + civilisation), avec un rituel « mot de passe » à réutiliser comme mécanique de jeu.

## 11. Points ouverts / risques à valider en Phase 3

- **Synchronisation Drive automatique** est la partie techniquement la plus délicate (authentification Google depuis une app locale, gestion des conflits si les deux appareils modifient la progression hors-ligne en même temps) — sera construite en dernier, après que le cœur de l'app fonctionne bien en local.
- **Tolérance de correction** sur les réponses saisies (fautes de frappe, variantes acceptées) à calibrer progressivement pendant les tests, matière par matière.
- **Login enfant** : proposition par défaut — écran de sélection de profil (avatar mascotte + prénom), sans mot de passe, adapté à un usage à la maison ; l'espace parent sera protégé séparément (code simple). À confirmer lors du premier test.

## 12. Plan de construction itérative (Phase 3)

Développement par étapes testables, validation à chaque étape avant de passer à la suivante :
1. **Squelette** : écran de sélection de profil (Adèle/Matys), navigation de base, sauvegarde locale minimale.
2. **Moteur de leçons** : affichage d'une leçon reformulée, échauffement, enchaînement leçon du jour / mode libre après le 19 juillet.
3. **Exercices** : les 3 formats prioritaires (saisie, glisser-déposer, manipulation visuelle), correction immédiate avec indices progressifs.
4. **Gamification** : points, badges, évolution de la mascotte par paliers.
5. **Tableau de bord parent**.
6. **Répétition espacée** et ajustements de difficulté.
7. **Synchronisation Google Drive** (en dernier, une fois le cœur de l'app stable).
