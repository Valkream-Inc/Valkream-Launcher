# 📘 API Reference – Valkream Update Server

Cette documentation couvre les routes générales exposées par l'API du serveur de mise à jour, y compris les routes pour :

- 📥 Uploads
- 🧩 Changements de version
- 🗂️ Récupération des anciennes versions
- 📄 Téléchargement de fichiers spécifiques
- ⚙️ Configuration dynamique

---

## 🔐 Authentification

Toutes les routes **POST** (et certaines GET sensibles) nécessitent une authentification via deux champs dans la requête :

- `api_key`
- `api_token`

Ces champs doivent être inclus dans :

- Le body `application/x-www-form-urlencoded` ou `form-data`

---

## 📤 Uploads

### `POST /launcher/latest`

Upload d'une nouvelle version du **launcher** (`combined-release.zip`)

### `POST /game/latest`

Upload d'une nouvelle version du **jeu** (`combined-game.zip`)

Champs requis (multipart/form-data) :

- `file` : archive `.zip` à extraire
- `api_key`, `api_token` : pour l’auth

---

## 🔁 Changement de version (sans fichier)

Ces routes modifient simplement le contenu de `latest/` en pointant vers une version déjà présente dans `old/`.

### `POST /launcher/change/`

Permet de définir une version précédente du launcher comme version active.

Body attendu :

```json
{
  "version": "1.0.2",
  "api_key": "...",
  "api_token": "..."
}
```

---

### `POST /game/change/`

Idem que ci-dessus, mais pour le jeu (modpack complet).

---

## 🗃️ Anciennes versions disponibles

Ces routes permettent d'obtenir la **liste des versions archivées** dans `/old`.

### `GET /launcher/old`

Retourne la liste des anciennes versions du launcher.

### `GET /game/old`

Retourne la liste des anciennes versions du jeu.

Réponse typique :

```json
["1.0.0", "1.0.1", "1.0.2"]
```

---

## 📄 Téléchargement de fichiers spécifiques

Ces routes servent des fichiers précis depuis le serveur.

### `GET /launcher/latest/:filename`

Télécharge un fichier contenu dans `/uploads/launcher/latest/`.

Exemple :

```
GET /launcher/latest/version.json
```

### `GET /game/latest/:filename`

Télécharge un fichier dans `/uploads/game/latest/`.

Exemple :

```
GET /game/latest/latest.yml
```

### `GET /config/:filename`

Permet d’accéder à un fichier de configuration côté serveur (utilisé par les panneaux d’admin ou autres).

Exemple :

```
GET /config/maintenance.json
```

---

## ⚙️ Configuration dynamique

### `POST /config/change-event/`

Met à jour dynamiquement un fichier de configuration lié à un **événement**, généralement stocké dans `/uploads/config/`.

Body attendu :

```json
{
  "api_key": "...",
  "api_token": "...",
  "event": {
    "name": "Halloween 2025 🎃",
    "enabled": true,
    "date": "2025-10-31T15:30:00.000Z",
    "description": "The Halloween event is a celebration of the end of the year. It is typically marked by a costume contest, a haunted house, and a parade. The event is typically held in October or November.",
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/",
    "link": "https://valkream.com/"
  }
}
```

> La structure exacte dépend de l’implémentation dans `config_change_event`.

---

### `POST /config/change-maintenance/`

Permet de modifier dynamiquement le mode **maintenance du launcher**.

Le système s’appuie sur un fichier `/uploads/config/maintenance.json` lu au démarrage ou pendant les checks automatiques du launcher côté client.

Body attendu :

```json
{
  "api_key": "...",
  "api_token": "...",
  "maintenance": {
    "enabled": true,
    "description": "La maintenance est en cours, veuillez patienter.",
    "end_date": "2022-05-01T00:00:00.000Z"
  }
}
```

---

## 🔒 Système de verrouillage

Toutes les routes critiques (upload, changement, config) sont protégées via le middleware `LockHandler(type, level)`, ce qui empêche plusieurs écritures concurrentes sur une même ressource (`game`, `launcher`, `config`). (deux personne ne peuvent pas effectur un changement simultanément)

---

## 📚 Résumé des routes

| Méthode | Route                         | Description                         |
| ------: | :---------------------------- | :---------------------------------- |
|  `POST` | `/launcher/latest`            | Upload nouvelle version du launcher |
|  `POST` | `/game/latest`                | Upload nouvelle version du jeu      |
|  `POST` | `/launcher/change/`           | Changer version active du launcher  |
|  `POST` | `/game/change/`               | Changer version active du jeu       |
|   `GET` | `/launcher/old`               | Lister anciennes versions launcher  |
|   `GET` | `/game/old`                   | Lister anciennes versions du jeu    |
|   `GET` | `/launcher/latest/:filename`  | Télécharger fichier du launcher     |
|   `GET` | `/game/latest/:filename`      | Télécharger fichier du jeu          |
|   `GET` | `/config/:filename`           | Télécharger config JSON             |
|  `POST` | `/config/change-event/`       | Modifier ou créer un événement      |
|  `POST` | `/config/change-maintenance/` | Activer/désactiver la maintenance   |

---
