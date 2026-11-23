# Valkream-Launcher

Launcher multi-jeux moddé pour les serveurs Valkream (Valheim, 7 Days to Die…) et serveur de fichiers de mise à jour.

<img src="./frontend\renderer\public\images\icon/Valkream-icon-with-name.png">

## License

This project is under the **MIT Non-Commercial License (MIT-NC)**.

[![License: MIT-NC](https://img.shields.io/badge/License-MIT--NC-blue.svg)](#license)

## Table des matières

- [Présentation](#présentation)
- [Fonctionnalités](#fonctionnalités)
- [Structure du projet](#structure-du-projet)
- [Installation (Développement)](#installation-développement)
- [Utilisation (Développement)](#utilisation-développement)
- [Test (Production)](#test-production)
- [Déploiement (Production)](#déploiement-production)
- [Auteurs](#auteurs)

---

## Présentation

Ce projet comprend :

- Un launcher Electron, générique : chaque jeu est une **instance** (config main + config render + fichiers remote), installée séparément en stable et en beta
- Un serveur backend statique qui sert `backend/public` (configs, `latest.yml`, manifestes de hash) pendant le développement

---

## Fonctionnalités

### Frontend (Electron Launcher)

- 🚀 **Téléchargement & mise à jour** du jeu (via HTTPS sécurisé)
- 🆚 **Vérification de la version** locale et en ligne du jeu/modpack
- 🧩 **Installation/Désinstallation** du jeu, des mods et du modpack (archives zip, manifestes de hash, Thunderstore)
- 🗂️ **Stable et beta isolées** : deux installations indépendantes par jeu
- ♻️ **Reprise et cache de hash** : seuls les fichiers absents ou modifiés sont retéléchargés ou revérifiés
- 🎉 **Gestion des événements spéciaux** (affichage dynamique dans l’interface)
- 🖥️ **Affichage des infos serveur** (joueurs, statut, ping, etc.)
- 🛡️ **Vérification d’intégrité** des plugins et configs (hash)
- 🎮 **Détection & gestion de l’installation Steam**
- 💬 **Notifications modernes** (snackbar, popup)
- 🖱️ **Interface multi-plateforme** (Windows, Linux, Mac)
- 🛑 **Mode maintenance** (affichage automatique si serveur en maintenance)
- 🌐 **Liens directs réseaux sociaux** (Discord, site web, top serveurs)
- 🔄 **Mise à jour automatique** du launcher via electron-updater
- 🎮 **Ouverture de steam** quand le jeu est lancé

> **⚠️ Attention** : A l'heure actuel l'installation cross-platforme ne fonctionne pas (seul windows fonctionne)

### Images

<br>
   <img src="./doc/images/home.png" style="max-width: 20cm">
---

## Structure du projet

- `frontend/` : le launcher Electron ([frontend/README.md](frontend/README.md))
- `backend/` : serveur Node.js qui sert les fichiers en dev ([backend/README.md](backend/README.md))
- `doc/` : [système d'instances](doc/instance-system/README.md) (architecture, formats, ajouter un jeu) et [déploiement d'une version du launcher](doc/new-launcher-version.doc.md)

---

> **⚠️ Attention** : Certains fichiers et dossier sont masqués sous vscode. (ex: les dossiers `/node_modules`). Ces fichiers sont masqués via le fichier `.vscode/settings.json`

## Installation (Développement)

### Install Requirement

```bash
winget install Microsoft.VisualStudio.2022.BuildTools --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
winget install Python.Python.3.15
winget install Schniz.fnm
fnm install 26
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
if (!(Test-Path $PROFILE)) { New-Item -Type File -Path $PROFILE -Force }; Add-Content $PROFILE 'fnm env --use-on-cd | Out-String | Invoke-Expression'
fnm default 26
```

### Installation des dépendances

À la racine du projet :

```bash
npm install -g corepack
yarn set version stable
yarn install
yarn workspace Valkream-Launcher rebuild
```

---

## Utilisation (Développement)

Le projet est entièrement en **TypeScript** (`.ts` / `.tsx`). Les types sont séparés du code :

- `frontend/shared/types/` : types partagés entre le main, le preload et le renderer (contrat IPC, réglages, jeux...)
- `frontend/main/src/types/` : types internes au process Electron (fichiers `.d.ts`)
- `frontend/renderer/src/**/*.types.ts` : types des composants et contextes React, à côté du code

```bash
yarn dev          # backend + launcher : Vite, esbuild (main), Electron, typecheck en watch (turbo)
yarn dev:fast     # idem sans les typecheck en watch (le plus léger)
yarn dev:fresh    # electron-rebuild puis yarn dev (après un changement d'Electron)
yarn dev:front    # launcher seul
yarn dev:back     # serveur de fichiers seul (http://localhost:3000)
yarn typecheck    # vérification des types (main, renderer, scripts, backend)
yarn lint         # ESLint
yarn build        # installeurs du launcher
yarn rebuild      # recompilation des modules natifs pour Electron
```

Des tâches équivalentes sont disponibles dans VS Code (`Terminal > Exécuter la tâche...`) et un profil de debug Electron est fourni dans `.vscode/launch.json`.

### Fichiers des jeux

Les gros fichiers (zips du jeu, dossiers de fichiers référencés par un manifeste de hash) ne sont pas dans le dépôt : ils sont hébergés sur le serveur et référencés par les `latest.yml` (ex : `/games/Valheim/latest/`). Les `.zip` doivent contenir directement les fichiers (pas de dossier parent). Voir [Publier une version d'un jeu](doc/instance-system/README.md#publier-une-version-dun-jeu).

## Test (Production)

1. Pusher les modifications sur la main github
2. Attendre la fin du workflow de build (il lance `yarn build`, qui vérifie aussi que le système de mise à jour du build est cohérent : `yarn check:build`, et que le build s'exécute : `yarn check:runtime`)
3. Télécharger l'installer depuis github et l'installer sur le PC de test
4. Lancer le launcher et vérifier qu'il fonctionne

Pour tester le launcher **sans passer par la mise à jour**, faire un **Ctrl + Maj + clic sur la vidéo** de la fenêtre de mise à jour.

L'installation de la mise à jour ne supprime rien (jeux et réglages conservés ; une nouvelle version majeure du launcher nettoie les installations au premier démarrage). Seule la désinstallation complète supprime les jeux, y compris ceux d'un dossier choisi ailleurs.

---

## Déploiement (Production)

Pour un déploiment `simple` en production, il suffit de copier le dossier public du backend sur un serveur de fichiers statique et de configurer le launcher pour utiliser le bonne url.

---

## Auteurs

- Jean-Chante (Valkream Team)

---
