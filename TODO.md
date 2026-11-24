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
