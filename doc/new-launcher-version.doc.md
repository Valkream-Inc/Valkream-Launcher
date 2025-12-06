# 📦 Déploiement d'une Nouvelle Version du Launcher

Ce guide explique comment uploader une nouvelle version du launcher sur le serveur de mise à jour :

- 🛠️ En copiant directement les fichiers sur le serveur

## 🧭 Sommaire

1. [Pré-requis](#pré-requis)
2. [Structure des fichiers attendue](#structure-des-fichiers-attendue)
3. [Méthode 1 - Upload direct dans les fichiers du serveur](#méthode-1---upload-direct-dans-les-fichiers-du-serveur)
4. [Archivage automatique](#archivage-automatique)
5. [Notes importantes](#notes-importantes)

## 📌 Pré-requis

- Accès au serveur (API ou SSH selon la méthode choisie)
- Télécharger les `combined-******.zip` du launcher sur [GitHub](https://github.com/Valkream-Inc/Valkream-Launcher/releases)

## 📁 Structure des fichiers attendue

```
/ #racine
└── /launcher
    ├── /latest/ # Contient la version actuelle (dézippée)
    ├── /old/ # Contient les anciennes versions
        └── 1.0.2/ # Exemple d'ancienne version archivée
```

## 🗃️ Méthode 1 - Upload direct dans les fichiers du serveur

### Étapes :

1. Se connecter au serveur via SSH ou SFTP
2. Aller dans `/launcher`
3. Identifier la version actuelle (`cat latest/latest.yml` ou autre)
4. Déplacer le contenu de `latest/` dans `old/<version>/`, par exemple :

```bash
mv latest old/1.0.2
mkdir latest
```

5. Uploader manuellement les `combined-******.zip`
6. Extraire les archives dans `latest/` :

```bash
# exemple
unzip combined-release.zip -d latest/
```

---

## ⚠️ Notes importantes

- Le `.zip` doit contenir directement les fichiers du launcher (pas un dossier parent).
- Ne jamais écraser le dossier `latest/` sans sauvegarder la version précédente.
- Vérifiez toujours que l’extraction a bien fonctionné et que tous les fichiers nécessaires sont présents.

---
