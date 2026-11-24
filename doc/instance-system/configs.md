# Guide des configs (à lire en premier)

Ce guide répond à une seule question : **« je veux faire X, quel fichier je modifie, et que j'écris dedans ? »**
Le détail de chaque mécanisme (hash, Steam, Nexus…) est dans le [README du système d'instances](README.md).

## 1. Les 5 fichiers de config en un coup d'œil

Un jeu (une **instance**) est décrit par une clé commune, son `id` (ex : `Valheim-Valkream-v2`), répétée dans 3 couches.

| # | Fichier | Qui le modifie | Quand ça prend effet | Sert à |
| --- | --- | --- | --- | --- |
| 1 | `frontend/main/src/instances/instances.config.ts` | développeur | nouvelle version du **launcher** | **où** installer, **comment** lancer, serveur de jeu |
| 2 | `frontend/renderer/src/instances/instances.config.tsx` | développeur | nouvelle version du **launcher** | **look** : images, fonds, textes, réglages affichés |
| 3 | `backend/public/games/<id>/index.config.json` | admin | immédiat (serveur) | **quels canaux** existent, plateformes, événement, mods affichés |
| 4 | `backend/public/games/<id>/latest.yml` (`latest.beta.yml`…) | admin | immédiat (serveur) | **quoi** installer et **quelle version** |
| 5 | `backend/public/games/<id>/config/*.json` | admin | immédiat (serveur) | événement, maintenance, liste des mods, contributeurs (affichage) |

Règle d'or : **le serveur ne décide jamais où le launcher écrit sur le disque.** Les chemins sont dans le fichier 1
(`entryPaths`) ; mettre `path` dans un `latest.yml` est refusé. Un serveur compromis ne peut donc pas écrire n'importe où.

```
joueur ouvre le launcher
   └─ fichier 1 (main)   : « Valheim-Valkream-v2 existe, son index est à /games/…/index.config.json »
        └─ fichier 3     : « canal stable = /games/…/latest.yml »
             └─ fichier 4 : « entrée `bepinex` version 5.4.2333, type zip_url, lien… »
                  └─ fichier 1 (entryPaths) : « `bepinex` s'installe dans game/ »
```

## 2. « Je veux… » → quel fichier

| Je veux… | Je modifie | Détail |
| --- | --- | --- |
| Publier une nouvelle version d'un mod ou d'une config | 4 (`latest.yml`) | changer `version` de l'entrée (et `content`/`hash` si besoin) |
| Mettre à jour le jeu lui-même | 4 → entrée de `game-base` | nouvelle `version` + nouveau lien/hash |
| Tester avant les joueurs | 4 (`latest.beta.yml`) | puis reporter dans `latest.yml` ; voir §5 |
| Ajouter un mod Thunderstore | 4 | ajouter `Auteur-Nom-Version` dans la liste de l'entrée Thunderstore |
| Ajouter une **nouvelle entrée** (nouveau dossier d'installation) | 1 (`entryPaths`) **et** 4 | l'entrée doit exister dans les deux, sinon elle est refusée |
| Changer l'emplacement d'une entrée | 1 (`entryPaths`) | le launcher réinstalle l'entrée au nouvel endroit |
| Afficher un événement / une maintenance | 5 (`event.json`, `maintenance.json`) | bandeau dans l'accueil ; une valeur par canal possible (§5) |
| Changer la liste des mods affichée aux joueurs | 5 (`mods.json`) | l'onglet Tools génère ce fichier |
| Changer l'exécutable, les arguments de lancement, Java | 1 | `executable`, `command`, `launchArgs` |
| Ajouter un réglage joueur (case, liste, curseur) | 2 (`customGamesSettings`) | utilisable dans `launchArgs` via `{nom}` |
| Changer images, fond, musique, modèle 3D, textes | 2 | fichiers dans `frontend/renderer/public/` |
| **Ajouter un jeu** | 1 + 2 + un dossier `backend/public/games/<id>/` | voir §6 |
| Désactiver un jeu sur une plateforme | 3 (`enabled`) | `win32` / `linux` / `darwin` |

## 3. Le `latest.yml` pas à pas

Un `latest.yml` est une **liste d'entrées**, rangées en deux niveaux. Chaque entrée = « un morceau à installer ».

```yaml
version: 2.34.37          # affichage seulement ; la mise à jour se décide entrée par entrée

game-base:                # niveau 1 : le jeu. En retard = réinstallation complète
  valheim:                # nom de l'entrée → doit exister dans entryPaths (fichier 1)
    version: 0.221.12     # change ⇒ le launcher remplace cette entrée
    type: zip_url         # comment on l'installe (voir §4)
    content: https://…/build-game-win32.zip

game-details:             # niveau 2 : mods, configs. Mise à jour incrémentale
  configs:
    version: 2.34.37
    type: zip_url
    folder_in_zip: config # on ne prend que ce dossier de l'archive
    content: https://thunderstore.io/package/download/ValheimValkream/Valkream/2.34.37/
    gameFolderToPreserve: [valheim_server.cfg]   # gardé tel quel chez le joueur
```

**Quand une entrée est-elle réinstallée ?** Quand sa `version` change, ou (pour `hash_url`) quand les fichiers du joueur ne
correspondent plus au `hash`. **Si tu changes `content` sans changer `version`, le launcher ne le voit pas** : incrémente toujours `version`.

**Options d'une entrée** (toutes optionnelles sauf `version` et `type`) :

| Option | Rôle | Exemple |
| --- | --- | --- |
| `type` | provider d'installation | `zip_url` |
| `content` | quoi télécharger : lien, liste ou manifeste | `https://…` |
| `hash` | sha256 du manifeste (types à hash) | généré par `yarn build:manifest` |
| `folder_in_zip` | sous-dossier de l'archive à extraire (sans `/` initial) | `config` |
| `gameFolderToRemove` | supprimés avant la mise à jour | `[BepInEx/cache]` |
| `gameFolderToPreserve` | gardés à la mise à jour (config du joueur) | `[fichier.cfg]` ou `{ path, from: ">=1.2.0" }` |
| `to_ignore` | motifs ignorés par le hash et le nettoyage (logs, caches) | `[logs/**]` |
| `optional` | installée seulement si un réglage joueur est actif | `{ setting: boostFps }` |
| `key` | où lire la liste dans un fichier JSON lié | `dependencies.mods` |

Toute option (sauf `version`) peut être **déclinée par plateforme** :

```yaml
content:
  win32: https://…/build-win.zip
  linux: https://…/build-linux.zip
  default: https://…/build.zip      # utilisée si la plateforme n'est pas listée
```

Une entrée sans valeur pour la plateforme du joueur est simplement **ignorée** (pas d'erreur).

Pour `steam_library`, `buildid`, `steam-beta` et `depot` se déclinent aussi par plateforme (le depot Steam d'un jeu n'est pas
le même sous Windows et Linux). Sans `depot` pour la plateforme du joueur, la solution DepotDownloader n'est pas proposée :

```yaml
valheim:
  type: steam_library
  content: /games/Valheim-Valkream-v2/valheim-manifest.json
  buildid: { win32: 15245500, linux: 15245501 }   # valeurs d'exemple : à lire sur SteamDB
  depot:
    win32: { id: 892971, manifest: "5099988776655443322" }
    linux: { id: 896661, manifest: "1122334455667788990" }
```

**Une chaîne qui commence par `/` est un lien** vers un fichier du serveur (`/games/<id>/modpack.json`), pas un chemin disque :
`folder_in_zip` et `path` s'écrivent donc sans `/` au début.

## 4. Quel `type` choisir ?

| Je veux installer… | `type` | `content` | Bon à savoir |
| --- | --- | --- | --- |
| une archive (jeu, BepInEx, config) | `zip_url` | lien vers un `.zip` ou `.tar.gz` | le plus simple ; pas de vérification fichier par fichier |
| un dossier de fichiers **vérifié par hash** | `hash_url` | lien vers `hash.json` | réparable, mises à jour fichier par fichier ; `hash` obligatoire |
| des mods Thunderstore | `thunderstore_modpack_url` | liste `[Auteur-Nom-Version, …]` | chaque mod a son dossier ; `api-url` pour Hexium |
| des mods Nexus Mods | `nexus_modpack_url` | liste `jeu-idMod-idFichier` | clé API **Premium** du joueur, `.zip` seulement |
| le jeu depuis la copie **Steam du joueur** | `steam_library` | manifeste de hash du jeu | rien n'est hébergé chez nous ; voir README « Jeux Steam » |

Arbre de décision rapide :

```
C'est le jeu commercial (Steam) ?            → steam_library
C'est un mod publié sur Thunderstore/Hexium ? → thunderstore_modpack_url
C'est un mod sur Nexus Mods ?                → nexus_modpack_url
Les fichiers doivent être réparables un par un ? → hash_url
Sinon                                        → zip_url
```

## 5. Les canaux : stable, beta, alpha

`index.config.json` (fichier 3) pointe un `latest*.yml` **par canal** :

```json
"channels": {
  "stable": "/games/Valheim-Valkream-v2/latest.yml",
  "beta":   "/games/Valheim-Valkream-v2/latest.beta.yml",
  "alpha":  "/games/Valheim-Valkream-v2/latest.alpha.yml"
}
```

- Chaque canal a **sa propre installation** sur le disque : tester la beta ne touche jamais le jeu stable.
- `stable` est toujours proposé ; `beta` et `alpha` seulement si le joueur active « Afficher les canaux de test ».
- Un canal absent d'`index.config.json` n'existe pas. Un jeu **sans `stable`** n'apparaît que si les tests sont activés.
- Workflow type : modifier `latest.beta.yml` → tester → copier dans `latest.yml`.

**Événement, maintenance, mods, contributeurs : une valeur par canal.** Ces quatre champs de `index.config.json` acceptent
soit une valeur unique (lien `/chemin` ou données en ligne), soit une table par canal :

```json
"event": {
  "stable": "/games/Valheim-Valkream-v2/config/event.json",
  "beta":   "/games/Valheim-Valkream-v2/config/event.beta.json"
},
"maintenance": { "beta": { "enabled": true, "description": "Test en cours", "end_date": "2026-12-01" } },
"mods": { "default": "/games/Valheim-Valkream-v2/config/mods.json", "alpha": "/games/Valheim-Valkream-v2/config/mods.alpha.json" }
```

- Chaque valeur est un lien ou des données, comme pour une valeur unique.
- Canal absent de la table : `default`, puis `stable`. S'il n'y a ni l'un ni l'autre, rien n'est affiché pour ce canal.
- Une table n'est reconnue que si **toutes** ses clés sont `stable`, `beta`, `alpha` ou `default` : un événement qui a ses propres champs
  (`name`, `description`…) reste une donnée.
- L'accueil affiche l'événement et la maintenance **du canal sélectionné** ; les onglets Mods et Contributeurs, ceux du canal ouvert.

## 6. Ajouter un jeu en 3 étapes

1. **Main** (`instances.config.ts`) : `id`, `server` (type GameDig, host, port), `indexUrl`, `entryPaths` (où va chaque
   entrée), `executable` (ou `command` + `launchArgs`), `steamAppId` si c'est un jeu Steam.
2. **Render** (`instances.config.tsx`) : `name`, `images`, `background` (image, vidéo, audio, modèle 3D), `translations`,
   `customGamesSettings`. Déposer les fichiers dans `frontend/renderer/public/`.
3. **Remote** : créer `backend/public/games/<id>/` avec `index.config.json` et un `latest.yml`, puis lancer `yarn test` :
   `backend-files.test.ts` recoupe les trois couches et signale ce qui manque.

Exemples complets prêts à copier : [`examples/`](examples/README.md) (Valheim alpha via Steam, Minecraft avec Java installé par le launcher).

## 7. Erreurs fréquentes

| Symptôme | Cause probable | Correction |
| --- | --- | --- |
| Entrée « non proposée » sur une plateforme | `content` ou `type` sans valeur pour cette plateforme et pas de `default` | ajouter la plateforme ou `default` |
| Entrée refusée : chemin inconnu | le nom d'entrée n'est pas dans `entryPaths` (fichier 1) | l'ajouter côté main (nouvelle version du launcher) |
| « `path` interdit » | `path:` écrit dans le `latest.yml` | le retirer : le chemin vient du main |
| Le joueur ne reçoit pas ma mise à jour | `content` changé mais `version` identique | incrémenter `version` |
| « hash invalide » / manifeste refusé | `hash` ne correspond plus à `hash.json` | relancer `yarn build:manifest … --latest latest.yml --entry <niveau>.<nom>` |
| « lien illisible » sur une option | URL ou `/chemin` inaccessible | vérifier le fichier sur le serveur ; l'entrée seule est invalidée, pas le launcher |
| « l'entrée `x` doit être installée avant » | `local:x/…` lu avant que `x` soit installée | déclarer `x` **avant** dans le `latest.yml` |
| Le jeu n'apparaît pas dans le choix | pas de canal visible (jeu sans `stable`, tests désactivés) ou `enabled` faux | voir §5 et `enabled` |
| Nexus : `err.nexusPremium` | compte Nexus sans Premium | impossible à automatiser sans Premium |
| Steam : fichiers d'une autre version | le jeu du joueur n'est pas au build attendu | le dialogue propose 3 solutions (README « Jeux Steam ») |

## 8. Glossaire

- **Instance** : un jeu (ou une variante) identifié par son `id`.
- **Canal** : stable / beta / alpha ; chacun a son installation.
- **Entrée** : un bloc du `latest.yml` (ex : `bepinex`) = un morceau installé dans un dossier.
- **Provider** : le code qui sait installer un `type` d'entrée.
- **Manifeste / hash** : liste `{ fichier: sha256 }` d'un dossier et l'empreinte de cette liste ; sert à vérifier et réparer.
- **Remote** : le serveur de fichiers (`backend/`) ; **main** : le process Electron ; **render** : l'interface React.
