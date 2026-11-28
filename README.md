# Valkream-Launcher

Launcher multi-jeux moddé pour les serveurs Valkream (Valheim, 7 Days to Die…) et serveur de fichiers de mise à jour.

<img src="./frontend/renderer/src/assets/icon/Valkream-icon-with-name.png" alt="Valkream" width="320">

[![License: MIT-NC](https://img.shields.io/badge/License-MIT--NC-blue.svg)](#licence)

## Table des matières

1. [Présentation](#présentation)
2. [Fonctionnalités](#fonctionnalités)
3. [Fonctionnement en bref](#fonctionnement-en-bref) : canaux, types d'entrées, options
4. [Documentation](#documentation)
5. [Structure du projet](#structure-du-projet)
6. [Démarrer en développement](#démarrer-en-développement)
7. [Commandes](#commandes)
8. [Tests et intégration continue](#tests-et-intégration-continue)
9. [Publier une version du launcher](#publier-une-version-du-launcher)
10. [Déploiement du serveur de fichiers](#déploiement-du-serveur-de-fichiers)
11. [Limites connues](#limites-connues)
12. [Licence](#licence) · [Auteurs](#auteurs)

---

## Présentation

Ce dépôt (monorepo `yarn` + `turbo`) contient :

- **`frontend/`** : un launcher **Electron** générique (React + MUI, TypeScript). Chaque jeu est une **instance** décrite par une config main, une config render et des fichiers remote ; elle s'installe séparément par canal (`stable`, `beta`, `alpha`).
- **`backend/`** : un serveur statique Node.js qui sert `backend/public` (configs, `latest.yml`, manifestes de hash) en développement. En production, ce même dossier est copié sur n'importe quel serveur de fichiers.

<img src="./doc/images/home.png" alt="Accueil du launcher" width="560">

---

## Fonctionnalités

### Jeux et mises à jour

- 🧩 **Installation, mise à jour et réparation** d'un jeu, de ses mods et de son modpack (archives zip, manifestes de hash, Thunderstore, Nexus Mods), avec reprise après coupure et cache de hash : seuls les fichiers absents ou modifiés sont retraités.
- 🗂️ **Canaux isolés** (stable / beta / alpha) : une installation indépendante par canal.
- 🎮 **Jeux Steam sans héberger les fichiers du jeu** : copie depuis la bibliothèque Steam du joueur (`steam_library`) ou version exacte téléchargée avec DepotDownloader, connexion par **QR code** (`depot_steam`).
- 🔀 **Config remote déclinable** : toute clé peut varier par canal, plateforme et langue ; fichiers YAML ou JSON ; adresse du serveur de jeu définie dans l'`index.config`.
- 🗑️ **Installations obsolètes** (jeu retiré, désactivé, canal supprimé) : listées avec un label, lançables, désinstallables.
- 📦 **Dossier des jeux déplaçable** (même vers un autre disque), progression en octets.

### Interface

- 📊 **Progression détaillée** : pourcentage à la décimale, octets traités / total, vitesse, étapes d'analyse, de copie et de téléchargement.
- 🔔 **Notifications système** : téléchargement terminé, erreur, action requise (QR code à scanner, popup Steam).
- 🎨 **Trois thèmes** (moderne, old, futuriste), popups adaptés aux petits écrans, bannière d'événement propre à chaque thème.
- 🌐 **Français / anglais** (interface, erreurs, étapes) et zoom mémorisé.
- 🎉 **Événements, mode maintenance, infos serveur** (joueurs, statut, ping), liens vers Discord / site / classement.

### Launcher

- 🔄 **Mise à jour automatique** du launcher (electron-updater, build « update » différentiel).
- 🛡️ **Intégrité** : manifestes de hash, vérification avant écriture, outils tiers vérifiés par sha256, chemins confinés (le remote ne décide jamais où le launcher écrit).
- 🛠️ **Outils admin** (onglets Dev, Tools, Debug) pour préparer le remote : hash d'un dossier, liste de mods, diagnostic, réparation.

> **⚠️ Attention** : seul **Windows** est supporté pour l'instant (l'installation multi-plateforme n'est pas finalisée).

---

## Fonctionnement en bref

Un jeu = une **instance**, décrite par trois couches : config **main** (chemins, lancement), config **render** (textes, images, mods affichés) et fichiers **remote** (versions, hébergés sur le serveur de fichiers). Voir le [guide des configs](doc/instance-system/configs.md) pour savoir quel fichier modifier.

### Canaux

| Canal | Visible | Usage |
| --- | --- | --- |
| `stable` | toujours | version publique |
| `beta` | si « Afficher les canaux de test » est actif | tests publics |
| `alpha` | si « Afficher les canaux de test » est actif | tests internes |

Chaque canal est une installation indépendante. **Si aucun jeu du catalogue n'a de `stable`**, les `beta` sont proposées d'office (sinon la première page serait vide).

### Types d'entrées du `latest.yml`

| `type` | Source | Usage typique |
| --- | --- | --- |
| `zip_url` | archive `.zip` ou `.tar.gz` | modpack, configs |
| `hash_url` | manifeste de hash `{ fichier: sha256 }` | gros jeux, mises à jour par différence |
| `thunderstore_modpack_url` | liste `Auteur-Nom-Version` (Thunderstore ou Hexium via `api-url`) | mods |
| `nexus_modpack_url` | liste `jeu-idMod-idFichier` (clé API Nexus du joueur) | mods Nexus |
| `steam_library` | fichiers copiés depuis la bibliothèque Steam du joueur | jeu Steam sans l'héberger |
| `depot_steam` | DepotDownloader (connexion par QR code) | version exacte d'un jeu Steam |
| `empty` | aucun contenu | entrée vide volontaire (dossier créé, rien à installer) |

Une entrée sans dossier dans la config main, sans `type` ou sans contenu est ignorée (sauf `empty`).

### Options d'une entrée

Toute option peut être déclinée **par canal, plateforme et langue** (voir le guide des configs).

| Option | Rôle |
| --- | --- |
| `path` | dossier d'installation de l'entrée (relatif, sans `/` initial) |
| `hash` | empreinte attendue : manifeste (`hash_url`), sha256 de l'archive (`zip_url`, `.zip` et `.tar.gz` vérifiés), liste (mods) |
| `content`, `key` | source des données (inline, lien, `local:<entrée>/<fichier>`) et chemin dans un JSON lié |
| `zip`, `folder_in_zip` | archive de tous les fichiers d'un manifeste / dossier à extraire d'une archive |
| `hash-folder` | dossier de fichiers individuels (repli et fichiers hors Steam) |
| `api-url` | API compatible Thunderstore (ex : `https://hexium.gg`) ou Nexus |
| `dependencies` | active la résolution des dépendances Thunderstore ; `skip` : dossiers jamais installés. **Sans cette option, seule la liste fournie est installée** |
| `to_ignore` | motifs exclus du hash, de la vérification et du nettoyage |
| `gameFolderToRemove`, `gameFolderToPreserve` | dossiers supprimés / conservés lors d'une mise à jour |
| `optional` | entrée installée seulement si un réglage d'instance est actif |

Détail et exemples : [Système d'instances](doc/instance-system/README.md) et [guide des configs](doc/instance-system/configs.md).

### Outils admin (réglages → Dev, Tools, Debug)

- **Hash d'un dossier** : `hash` du `latest.yml` + `hash.json` prêts pour le serveur.
- **Hash d'un fichier ou d'un manifeste** : `yarn workspace Valkream-Launcher hash:file <fichier>`.
- **Liste de mods** : génère les `ModDisplay` (nom, image, description, lien) triés par ordre alphabétique ; indiquer le **jeu** (ex : `valheim`) pour obtenir des liens de page valides (Thunderstore / Hexium).
- **Diagnostic et réparation** d'une installation.

Ces onglets sont activés par le mode développeur (captures `doc/images/activer les devs*.png`).

---

## Documentation

| Je veux… | Document |
| --- | --- |
| comprendre quel fichier modifier pour changer une version, un mod, un événement… | [Guide des configs](doc/instance-system/configs.md) |
| la référence du système d'instances (providers, Steam, hash, canaux, réglages) | [Système d'instances](doc/instance-system/README.md) |
| publier une nouvelle version du launcher (CI, build, serveur) | [Publier une version du launcher](doc/new-launcher-version.doc.md) |
| connaître l'organisation du code Electron | [frontend/README.md](frontend/README.md) |
| connaître le serveur de dev | [backend/README.md](backend/README.md) |
| voir ce qui reste à faire | [TODO.md](TODO.md) |

L'index complet est dans [doc/README.md](doc/README.md).

---

## Structure du projet

```
frontend/   launcher Electron : main/ (process Node), renderer/ (React + MUI), shared/types/, scripts/
backend/    serveur statique de dev ; public/ = dossier à déployer (games/<id>/, launcher/)
doc/        documentation (guides, référence, images)
.github/    workflows : CI (tests, types, lint) et build / release du launcher
```

Le projet est entièrement en **TypeScript** (`.ts` / `.tsx`), types séparés du code : `frontend/shared/types/` (contrat main / preload / renderer), `frontend/main/src/types/` (interne au main), `*.types.ts` à côté des composants React.

---

## Démarrer en développement

Prérequis : **Node ≥ 26** (voir `engines` de `package.json`), **Yarn 4** via corepack, et sous Windows les outils de compilation C++ (modules natifs).

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
winget install Python.Python.3.15
winget install Schniz.fnm
fnm install 26
fnm default 26
```

Puis, à la racine du dépôt :

```bash
npm install -g corepack
corepack enable
yarn install
yarn dev
```

> Certains dossiers (`node_modules`…) sont masqués dans VS Code via `.vscode/settings.json`. Des tâches équivalentes aux commandes ci-dessous sont dans `Terminal > Exécuter la tâche...`, et un profil de debug Electron est fourni dans `.vscode/launch.json`.

### Mode développeur dans le launcher

Les onglets Dev, Tools et Debug des réglages (et la console de DepotDownloader dans le popup Steam) sont réservés aux admins : voir les captures `doc/images/activer les devs*.png`.

---

## Commandes

Depuis la racine du dépôt :

| Commande | Rôle |
| --- | --- |
| `yarn dev` | backend + launcher (Vite, esbuild, Electron, typecheck en watch) |
| `yarn dev:fast` | idem sans les typecheck en watch (le plus léger) |
| `yarn dev:front` / `yarn dev:back` | launcher seul / serveur de fichiers seul (http://localhost:3000) |
| `yarn workspace Valkream-Launcher test` | tests (`node:test` via `tsx`, `*.test.ts` à côté du code) |
| `yarn typecheck` | types du main, du renderer, des scripts et du backend |
| `yarn lint` | ESLint |
| `yarn build` | installeurs du launcher (compilation, build NSIS « install » et « update », vérifications `check:build` et `check:runtime`) |
| `yarn workspace Valkream-Launcher build:manifest <source> <sortie>` | manifeste de hash d'un dossier (voir le guide des configs) |
| `yarn workspace Valkream-Launcher hash:file <fichier>` | hash d'un zip (sha256) ou d'un manifeste `.json` (`--latest … --entry …` l'écrit dans le latest.yml) |
| `yarn workspace Valkream-Launcher depot:pin <tag>` | épingle une version de DepotDownloader (hash sha256) |

---

## Tests et intégration continue

- **CI** (`.github/workflows/ci.yml`) : à chaque push hors `main` et chaque pull request : installation (`yarn install --immutable`), tests, typecheck, lint (non bloquant pour l'instant). Les runs d'une même branche s'annulent entre eux.
- **Launcher Build** (`.github/workflows/build.yml`) : à chaque push sur `main` touchant `frontend/` ou les workflows : tests, typecheck, `yarn build`, publication de la release GitHub. Détail et pièges : [Publier une version du launcher](doc/new-launcher-version.doc.md).

Pour tester un build **sans passer par la mise à jour**, faire un **Ctrl + Maj + clic sur la vidéo** de la fenêtre de mise à jour.

---

## Publier une version du launcher

Résumé (procédure complète dans [doc/new-launcher-version.doc.md](doc/new-launcher-version.doc.md)) :

1. **Incrémenter `version`** dans `frontend/package.json` (le tag de la release en est déduit : un tag déjà existant fait échouer la publication).
2. Fusionner sur `main` : le workflow *Launcher Build* teste, compile et crée la release avec `combined-install-win.zip` et `combined-update-win.zip`.
3. Récupérer les zips depuis la [page des releases](https://github.com/Valkream-Inc/Valkream-Launcher/releases) et les déployer sur le serveur (`/launcher/latest/`, l'ancienne version archivée dans `/launcher/old/<version>/`).

L'installation d'une mise à jour ne supprime rien (jeux et réglages conservés) ; seule une nouvelle version **majeure** nettoie les installations au premier démarrage. Seule la désinstallation complète supprime les jeux, y compris ceux d'un dossier choisi ailleurs.

---

## Déploiement du serveur de fichiers

Copier `backend/public` sur un serveur de fichiers statique (HTTPS) et faire pointer le launcher vers son URL (`baseUrl` dans `frontend/main/src/core/constants.ts`). Les gros fichiers (zips du jeu, dossiers référencés par un manifeste de hash) ne sont pas dans le dépôt : ils sont hébergés sur le serveur et référencés par les `latest.yml`. Voir [Publier une version d'un jeu](doc/instance-system/README.md#publier-une-version-dun-jeu).

---

## Limites connues

- Windows uniquement (build et installation).
- Les installeurs NSIS, `check:runtime` et l'interface sous Electron n'ont pas encore été validés de bout en bout sur une machine de test : voir [TODO.md](TODO.md).
- Les motifs de détection des étapes et erreurs de DepotDownloader reposent sur ses messages usuels ; une cause inconnue retombe sur un message générique avec le détail brut.
- Pas de signature de code Windows (avertissement SmartScreen possible).

---

## Licence

Ce projet est sous licence **MIT Non-Commercial (MIT-NC)** : voir [LICENSE.md](LICENSE.md).

## Auteurs

- Jean-Chante (Valkream Team)
