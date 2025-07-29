# 📦 Déploiement d'une Nouvelle Version du Launcher

Ce guide explique comment uploader une nouvelle version du launcher sur le serveur de mise à jour, de deux manières différentes :

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
5. [Archivage automatique](#archivage-automatique)
6. [Notes importantes](#notes-importantes)

## 📌 Pré-requis

- Accès au serveur (API ou SSH selon la méthode choisie)
- Télécharger la `combined-release.zip` du launcher sur [GitHub](https://github.com/Valkream-Inc/Valkream-Launcher/releases)

## 📁 Structure des fichiers attendue

```
/uploads
└── /launcher
├── /latest/ # Contient la version actuelle (dézippée)
├── /old/ # Contient les anciennes versions
│ └── 1.0.2/ # Exemple d'ancienne version archivée
```

## 🛠️ Méthode 1 - Upload via l'API (recommandé)

### 🔐 Authentification

L'API nécessite une clé et un token (`api_key` et `api_token`) à fournir dans la requête.

### 📤 Requête `POST`

- **URL** : `https://votre-serveur.com/launcher/latest`
- **Méthode** : `POST`
- **Type de contenu** : `multipart/form-data`
- **Champs requis** :
  - `api_key`: votre clé API
  - `api_token`: votre token API
  - `file`: fichier `.zip` du launcher (ex: `combined-release.zip`)

### 📎 Exemple avec `curl`

```bash
curl -X POST https://votre-serveur.com/launcher/latest \
  -F "api_key=VOTRE_CLE_API" \
  -F "api_token=VOTRE_TOKEN_API" \
  -F "file=@combined-release.zip"
```

> ✅ Si l’upload est réussi :
>
> - Le contenu actuel de `latest/` est déplacé vers `/uploads/launcher/old/<version>/`
> - L’archive est extraite dans `/uploads/launcher/latest/`
> - Un fichier `version.json` est généré automatiquement

---

## 🗃️ Méthode 2 - Upload direct dans les fichiers du serveur

### Étapes :

1. Se connecter au serveur via SSH ou SFTP
2. Aller dans `/uploads/launcher`
3. Identifier la version actuelle (`cat latest/latest.yml` ou autre)
4. Déplacer le contenu de `latest/` dans `old/<version>/`, par exemple :

```bash
mv latest old/1.0.2
mkdir latest
```

5. Uploader manuellement `combined-release.zip`
6. Extraire l’archive dans `latest/` :

```bash
unzip combined-release.zip -d latest/
```

## 📦 Archivage automatique

Lors d’un upload via l’API :

- La version actuellement dans `/latest/` est déplacée dans `/uploads/launcher/old/<version>/`
- L’API déduit la version à archiver à partir du fichier `latest.yml` contenu dans `latest/` (ou d’un champ dans l’archive)

---

## ⚠️ Notes importantes

- Le `.zip` doit contenir directement les fichiers du launcher (pas un dossier parent).
- Ne jamais écraser le dossier `latest/` sans sauvegarder la version précédente.
- Vérifiez toujours que l’extraction a bien fonctionné et que tous les fichiers nécessaires sont présents.

---
