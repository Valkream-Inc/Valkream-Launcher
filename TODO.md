# TODO

Seules les tâches **ouvertes** sont listées. Légende : (+) petit · (++) moyen · (+++) gros.

## À faire avant la prochaine release

- [ ] `yarn install` puis committer `yarn.lock` (dépendances retirées, réorganisées ; la CI en `--immutable` échoue sinon).
- [ ] `yarn depot:pin <tag>` : renseigner `instances/install/depot/depot-config.ts` (URL + sha256 de DepotDownloader).
- [ ] Migrer 7 Days to Die (et Valheim) vers `steam_library` : générer le manifeste depuis une installation Steam propre (`yarn build:manifest … --manifest-only`), puis retirer les zips hébergés.
- [ ] Valider dans Electron : zoom, barre d'outils, défilement, pastilles de portée, canaux, déplacement du dossier des jeux (dont entre deux disques), pagination, fond 3D chargé à la demande, installeur NSIS (jamais compilé ici).
- [ ] Lancer `yarn build` complet : `check:build` et `check:runtime` (démarrage Electron) n'ont jamais tourné sur un vrai build.

## Moteur d'installation et publication

- [ ] (+++) Mise à jour différentielle des gros fichiers (bsdiff / zstd).
- [ ] (++) `build-manifest --zip` / `--tar.gz` : générer aussi l'archive d'une entrée `hash_url`.
- [ ] (+) Signature des manifestes (ou des `latest.yml`) pour ne pas dépendre uniquement de HTTPS.
- [ ] (+) Versionner les anciens `latest.yml` (rollback d'une version).
- [ ] (++) Dockerfile du backend + en-têtes de cache (ETag, `Cache-Control`) pour les gros fichiers.
- [ ] (+) Version majeure du launcher : option de conserver aussi les dossiers `gameFolderToPreserve`.

## Launcher / interface

- [ ] (+) Réglages : aperçu de la ligne de commande effective (admin / Debug).
- [ ] (+) Onglet Tools : champ « source Thunderstore » (`Auteur/Nom/Version` → dépendances) et écriture du hash dans le `latest.yml`.
- [ ] (++) Page Mods : recherche, filtres par catégorie, version installée vs disponible.
- [ ] (+) Plusieurs instances du même jeu : choix, duplication, suppression avec taille occupée.
- [ ] (++) Accessibilité : clavier, contraste des thèmes, `prefers-reduced-motion`.
- [ ] (++) Mode hors ligne explicite : bandeau « dernière version connue » quand seul le cache répond.
- [ ] (++) Migrer les CSS des thèmes vers MUI (modern → old → futuristic), avec contrôle visuel (base : `windows/launcher/theme/mui-themes.ts`).
- [ ] (++) Chemin d'installation par défaut demandé au premier démarrage (panel « info » + sélecteur de dossier).

## Code, tests, sécurité

- [ ] (++) Tests du renderer (contexts, `InstanceSettings`, `InstanceButton`) avec Testing Library.
- [ ] (++) Tests de bout en bout (Playwright + Electron) sur le backend de dev : installation, mise à jour, réparation.
- [ ] (+) Découper `launcher-ipc` / `instance-ipc` par domaine et typer les canaux IPC de bout en bout (`shared/types/ipc.d.ts`).
- [ ] (+) Fenêtres Electron : activer `sandbox` et une CSP plus stricte.
- [ ] (+) `yarn audit` / Dependabot.
- [ ] (+) Nombres et unités (« Mo ») de la progression : localiser le format.

## Propositions (à trier)

### Fiabilité des installations
- [ ] (++) Bouton « Réparer » proposé automatiquement quand le rapport détecte un fichier modifié ou manquant (aujourd'hui : onglet Debug seulement).
- [ ] (+) Vérification d'intégrité en arrière-plan après une mise à jour du jeu (hash des fichiers critiques) avec notification discrète.
- [ ] (+) Reprise après coupure de la bascule atomique : écrire un petit journal « bascule en cours » pour que « Vérifier » sache quoi terminer.
- [ ] (++) Test d'installation complète sur un faux serveur local (backend de dev + faux zips) dans la CI : installation, mise à jour, annulation, reprise.

### Performance
- [ ] (++) Fond 3D : réduire la définition et le nombre de particules selon la machine (`navigator.hardwareConcurrency`), pause quand la fenêtre est masquée ou minimisée.
- [ ] (+) Vidéos des jeux : poster + chargement différé, formats plus légers (WebM/AV1) pour alléger l'installeur (les 3 vidéos et 2 modèles 3D pèsent le plus).
- [ ] (+) Mesurer le temps de démarrage (fenêtre visible, premier panneau) et le garder sous un budget vérifié dans la CI.
- [ ] (+) Analyseur de bundle Vite (`rollup-plugin-visualizer`) pour repérer les modules lourds du renderer (MUI icons importés un par un).

### Build et release
- [ ] (+) CI : lancer `yarn check:build` et `yarn check:runtime` sur chaque PR (aujourd'hui seulement dans le workflow de build).
- [ ] (++) Signature de code Windows de l'installeur (SmartScreen) et publication automatique des notes de version.
- [ ] (+) Dependabot / Renovate groupé (renderer, outils de build, main) pour garder un `yarn.lock` à jour.
- [ ] (+) `yarn knip` (ou équivalent) en CI : détecte fichiers, exports et dépendances inutilisés avant qu'ils s'accumulent.

### Documentation
- [ ] (+) Schéma JSON de `index.config.json` et du `latest.yml` (`$schema`) : autocomplétion et validation dans VS Code pour les admins.
- [ ] (+) Commande `yarn new:game <id>` qui génère les trois fichiers de config d'un jeu à partir des exemples.
- [ ] (+) Page « Dépannage joueur » (jeu qui ne se lance pas, Steam introuvable, dossier non vide, pare-feu) liée depuis le launcher.

### Interface et accessibilité
- [ ] (+) Export / import des réglages du launcher (support et changement de PC).
- [ ] (+) Raccourcis clavier (Entrée = Jouer, Échap = retour) et focus visible sur tous les boutons.
- [ ] (++) Notifications de fin d'installation quand le launcher est en arrière-plan.
