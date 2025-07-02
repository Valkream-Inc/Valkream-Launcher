# Valkream-Launcher

Launcher et système de mise à jour pour le serveur Valheim Valkream.

<img src="./frontend-electron-launcher/src/assets/images/icon-with-name.png">

## Table des matières

- [Présentation](#présentation)
- [Structure du projet](#structure-du-projet)
- [Installation (Développement)](#installation-développement)
- [Utilisation (Développement)](#utilisation-développement)
- [Déploiement (Production/Test)](#déploiement-productiontest)
- [Commandes utiles](#commandes-utiles)
- [Auteurs](#auteurs)

---

## Présentation

Ce projet comprend :

- Un launcher Electron pour Valheim moddé
- Un serveur backend de gestion des mises à jour
- Un outil de build et de déploiement pour le jeu et le launcher

## Structure du projet

- `frontend-electron-launcher/` : Le launcher Electron (interface utilisateur)
- `backend-update-server/` : Serveur Node.js pour la gestion des mises à jour
- `game-updater/` : Scripts de build et de déploiement du jeu
- `shared function/` : Fonctions partagées entre les modules

---

> **Attention** : ⚠️ Certains fichiers et dossier sont masqués sous vscode. (ex: les dossiers `/node_modules`). Ces fichiers sont masqués via le fichier `.vscode/settings.json`

## Installation (Développement)

### Prérequis

- Node.js (version : 22+)
- Yarn

### Installation des dépendances

Executer une fois a la racine du projet :

```bash
yarn install
```

---

## Utilisation (Développement)

### Lancer le serveur de mise à jour (backend)

```bash
cd backend-update-server
yarn run start # ou yarn run dev
```

### Lancer le launcher Electron (frontend)

```bash
cd frontend-electron-launcher
yarn dev
```

### Builder le jeu ou le launcher

```bash
# Pour builder le jeu
#copier le dossier de configuration du jeu "Valheim Valkream Data" dans le dossier "./game-updater" puis:
cd game-updater
yarn run build

# Pour builder le launcher
cd ../frontend-electron-launcher
yarn run build
```

---

## Déploiement (Production/Test)

### Pousser une nouvelle version du jeu sur le serveur de test ou de prod

```bash
cd game-updater
yarn run post
```

### Pousser une nouvelle version du launcher sur le serveur de test ou de prod

```bash
cd frontend-electron-launcher
yarn run post
```

> **Remarque** : Les scripts `post` envoient le build compressé au serveur de mise à jour (backend). Assurez-vous que le backend est bien configuré et accessible. (voir prod plus bas)

### Changer la version du jeu ou su launcher

```bash
# Pour changer la version du jeu
cd game-updater
yarn run change

# Pour changer la version du launcher
cd ../frontend-electron-launcher
yarn run change
```

---

### Changer l’événement du jeu

```bash
cd game-updater
yarn run change-event
```

## pour la prod copier le backend dans le serveur

### executer une fois a la racine du projet :

```bash
yarn install
yarn run start
```

### modifier le .env

mettez vos clés api dans le .env et modifiez le port si necessaire

```bash
PORT=3000
apiKey=SECRET_API_KEY
apiToken=SECRET_API_TOKEN
```

### en local

#### modifier les clés api ./secured_config.js

#### modifier l'url dans ./shared function/config.js et mettez isForProduction à true

### executer les commandes suivantes pour initialiser la premiere mise à jour sur le serveur

```bash
#copier le dossier de configuration du jeu "Valheim Valkream Data" dans le dossier "./game-updater" puis :
cd game-updater
yarn run build
yarn run post

cd ../frontend-electron-launcher
yarn run build
yarn run post
```

ensuite telecharger le launcher depuis `http://votre_url/launcher/latest/Valkream-Launcher-win-x64.exe`

## Auteurs

```bash
- Valkream Team
```
