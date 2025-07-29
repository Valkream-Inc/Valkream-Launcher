# 🕹️ Déploiement d'une Nouvelle Version du Jeu (Valheim Moddé)

Ce guide explique comment uploader une nouvelle version complète du jeu (Valheim + BepInEx + mods) sur le serveur de mise à jour :

- ✅ Via l'API (méthode recommandée)
- 🛠️ En copiant directement les fichiers sur le serveur

## 🧭 Sommaire

1. [Pré-requis](#pré-requis)
2. [Structure des fichiers attendue](#structure-des-fichiers-attendue)
3. [Méthode 1 - Upload via l'API (recommandé)](#méthode-1---upload-via-lapi-recommandé)
   - [Authentification](#authentification)
   - [Requête `POST`](#requête-post)
   - [Exemple avec `curl`](#exemple-avec-curl)
4. [Méthode 2 - Upload direct dans les fichiers du serveur](#méthode-2---upload-direct-dans-les-fichiers-du-serveur)
5. [Fichier `latest.yml`](#fichier-latestyml)
6. [Archivage automatique](#archivage-automatique)
7. [Notes importantes](#notes-importantes)

---

## 📌 Pré-requis

- Accès au serveur (API ou SSH selon la méthode choisie)
- Avoir généré l'archive `combined-game.zip` contenant :
  - Le fichier `latest.yml` à la racine de l'archive
  - Les zip des chemins relatif présent dans le fichier latest.yml

## 📁 Structure des fichiers attendue

```

/uploads
└── /game
├── /latest/            # Contient la version actuelle du jeu (dézippée)
├── /old/               # Contient les anciennes versions
│   └── 2.1.15/         # Exemple d'ancienne version archivées

```

---

## 🛠️ Méthode 1 - Upload via l'API (recommandé)

### 🔐 Authentification

L'API nécessite une clé et un token (`api_key` et `api_token`) à fournir dans la requête.

### 📤 Requête `POST`

- **URL** : `https://votre-serveur.com/game/latest`
- **Méthode** : `POST`
- **Type de contenu** : `multipart/form-data`
- **Champs requis** :
  - `api_key`: votre clé API
  - `api_token`: votre token API
  - `file`: fichier `.zip` du jeu (ex: `combined-game.zip`)

### 📎 Exemple avec `curl`

```bash
curl -X POST https://votre-serveur.com/game/latest \
  -F "api_key=VOTRE_CLE_API" \
  -F "api_token=VOTRE_TOKEN_API" \
  -F "file=@combined-game.zip"
```

> ✅ Si l’upload est réussi :
>
> - La version actuelle est déplacée dans `/uploads/game/old/<version>/`
> - Le contenu de l'archive est extrait dans `/uploads/game/latest/`
> - Le fichier `latest.yml` est utilisé pour enregistrer la version et les métadonnées

---

## 🗃️ Méthode 2 - Upload direct dans les fichiers du serveur

### Étapes :

1. Se connecter au serveur via SSH ou SFTP
2. Aller dans `/uploads/game`
3. Vérifier la version actuelle dans `latest/latest.yml`
4. Déplacer le contenu de `latest/` dans `old/<version>/`, par exemple :

```bash
cd /uploads/game
mv latest old/2.1.15
mkdir latest
```

5. Uploader manuellement `combined-game.zip`
6. Extraire l’archive dans `latest/` :

```bash
unzip combined-game.zip -d latest/
```

---

## 📝 Fichier `latest.yml`

Le fichier `latest.yml` est **obligatoire** à la racine du dossier `latest/`. Il contient :

- La version du modpack et sa date de build
- Les liens de téléchargement de Valheim et BepInEx
- La liste des mods admin, fichiers à préserver et à supprimer
- Les hash de dossier de configs/plugins

### 🧾 Exemple

```yaml
version: 2.1.16
buildDate: 2025-07-03T19:20:08.929Z

modpack:
  dowload_url: https://thunderstore.io/package/download/ValheimValkream/Valkream/2.1.16/
  admin_mods:
    - "JereKuusela-Infinity_Hammer-1.72.0"
    - "JereKuusela-Server_devcommands-1.97.0"
  gameFolderToRemove:
    - /BepInEx/cache
  gameFolderToPreserve:
    - /BepInEx/plugins/JereKuusela-Infinity_Hammer-1.72.0/
  hash:
    config: 105517d181528eb09cc8c3360efaa275
    plugins: f0c7a72372bba288cff438b73c9b2b34264c1370d90201902c7ceb65977d413a

valheim:
  version: 0.220.5
  dowload_url:
    win32: /game/latest/build-game-win32.zip
    linux: /game/latest/build-game-linux.zip
    darwin: /game/latest/build-game-darwin.zip

bepinex:
  version: 5.4.2202
  dowload_url:
    win32: /game/latest/BepInEx-5.4.2202.zip
    linux: /game/latest/BepInEx-5.4.2202.zip
    darwin: /game/latest/BepInEx-5.4.2202.zip
```

---

## 📦 Archivage automatique

Lors d’un upload via l’API :

- La version précédente (contenue dans `latest/`) est déplacée vers `/uploads/game/old/<version>/`, en se basant sur la propriété `version` du `latest.yml`.

Pour les uploads manuels, cela doit être fait à la main avant extraction.

---

## ⚠️ Notes importantes

- L’archive `.zip` doit contenir **directement les fichiers** du jeu + le `latest.yml` à la racine.
- Le champ `version` dans `latest.yml` est **obligatoire**.
- Ne jamais écraser `/latest/` sans archiver la version précédente.
- Toujours tester le jeu localement avant déploiement.

---
