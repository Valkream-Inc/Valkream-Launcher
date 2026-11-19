# Système d'instances

Une **instance** = un jeu (ou une variante d'un jeu) décrit par trois couches reliées par un `id` unique (ex : `Valheim-Valkream-v2`).

| Couche | Fichier | Décide |
| --- | --- | --- |
| Main | `frontend/main/src/instances/instances.config.ts` | serveur de jeu, lien de l'`index.config.json` du jeu (`indexUrl`), **dossier d'installation de chaque entrée** (`entryPaths`, par nom d'entrée, déclinable par plateforme), exécutable, Steam |
| Render | `frontend/renderer/src/instances/instances.config.tsx` | nom, images, **fonds** (image, vidéo, audio, modèle 3D + scène), textes, liens, réglages (`customGamesSettings`, niveaux normal / special / danger), tableaux Debug |
| Remote | `backend/public/games/<id>/` | `index.config.json` (plateformes, **liens des latest stable / beta**, événement, maintenance, mods, contributeurs) et `latest.yml` / `latest.beta.yml` (versions, sources, hash) |

Le remote ne décide jamais où le launcher écrit : `path` est interdit dans le `latest.yml`.

## Organisation du code

```
backend/public/games/<id>/        index.config.json, latest*.yml, hash*.json, *.config.json
frontend/
  shared/types/                   types partagés main / renderer (.d.ts seulement)
  main/src/
    engine/
      lib/                        utilitaires purs : paths, patterns, version
      remote/                     lien, résolveur + cache, validation, options par plateforme / lien, registre, index
      install/                    installation : providers (zip, hash, thunderstore), conservation, hash, état
      instance/                   rapport (inspector), infos d'accueil, statut, lancement
      services.ts                 assemble les services avec les dépendances réelles
    instances/                    config main des instances
    ipc/ windows/ manager/ utils/ constants/   application Electron
  renderer/src/
    instances/                    config render des instances + helpers
    windows/launcher/             contexts, composants, panneaux (home, settings, choose-games)
  scripts/                        build-manifest, dev-main
```

`draft-original/` garde le brouillon de départ, commenté (spécification des champs de `latest.yml`).

## État

- Fait : types partagés, règle de lien, validation de l'index et du `latest.yml`, résolveur avec cache disque, registre, confinement des chemins.
- Fait : **installation par canal** (`instances/<id>/stable|beta/`) avec état (`instance.state.json`) et réglages (`instance.settings.json`) propres à chaque canal : la beta n'a aucun fichier en commun avec le stable.
- Fait : **moteur d'installation** (`engine/install/InstanceInstaller.ts`) : providers `zip_url`, `hash_url`, `thunderstore_modpack_url` ; reprise par entrée ; une synchronisation à la fois par installation.
- Fait : **rapport** (`instances:report`) : un statut par entrée + récapitulatif « fonctionne ou non ».
- Fait : **UI 100 % générique** : choix du jeu, accueil (un seul `InstanceButton` : installer / réinstaller / mettre à jour / jouer, avec progression), réglages General / Launcher / Game / Mods (affichage joueur) / Dev (outils + Debug admin avec « Réparer »). Fonds image / vidéo / 3D, loader, liens et infos serveur lisent la config render de l'instance active.
- Fait : instances `Valheim-Valkream-v2` et `SevenDtoD-Valkream-v2` (7 Days to Die installé entièrement dans le launcher, comme Valheim).
- Fait : **une seule API** `window.electron_API` (`getInstances`, `getInstanceInfos`, `getInstanceStatus`, `getInstanceReport`, `syncInstance`, `launchInstance`, `openInstanceFolder`, `uninstallInstance`, `setInstanceSetting`, `onInstanceProgress`…). Les anciens managers, IPC, panneaux et API par jeu (`electron_Valheim_API`, `electron_SevenDtoD_API`) sont supprimés.
- Pas de migration des anciennes installations : réinstallation propre dans `instances/<id>/<canal>/` (les anciens dossiers ne sont pas touchés).
- Pas encore : provider Nexus (signalé comme échec), dépendances transitives Thunderstore.

## Ajouter un jeu

1. Une entrée dans `main/src/instances/instances.config.ts` (serveur, chemins, exécutable, `steamAppId`).
2. Une entrée dans `renderer/src/instances/instances.config.tsx` (assets dans `public/`, 3D, textes, réglages).
3. Un dossier `backend/public/games/<id>/` avec son `index.config.json` (liens des latest stable / beta) et son `latest.yml`.

## Format du latest.yml

- Version globale `X0.X1.X2` (affichage seulement) : X0 saison, X1 `game-base`, X2 `game-details`.
- Deux niveaux, **tous deux forcés** : `game-base` (le jeu, réinstallation complète si en retard) et `game-details` (mods, configs, détails, mise à jour incrémentale). Le jeu n'est jouable en ligne que lorsque tout ce qui est actif est à jour ; hors ligne, on joue ce qui est installé. Les anciens `game-breaking` / `game-notbreaking` sont réunis sous `game-details`.
- **Toutes les options d'une entrée sauf `version`** (`path`, `type`, `hash`, `content`, `hash-folder`, `folder_in_zip`, `api-url`, `gameFolderToRemove`, `gameFolderToPreserve`, `to_ignore`, `optional`) :
  - peuvent être déclinées par plateforme : `{ win32: …, linux: …, darwin: …, default: … }` ;
  - prennent une valeur **inline**, un **chemin relatif** (`/chemin`, racine du serveur de fichiers) ou une **URL** (`https://…`) vers un fichier JSON/YAML qui contient la valeur. Le fichier lié peut lui-même être décliné par plateforme.
  - Une chaîne qui commence par `/` est donc un lien : `path` et `folder_in_zip` s'écrivent sans `/` initial.
  - Exceptions : `content` (archive, manifeste, liste), `hash-folder` et `api-url` sont déjà des liens vers ce que le provider télécharge : seule leur plateforme est choisie.
  - Une entrée dont `path`, `type` ou `content` n'a pas de valeur pour la plateforme (ni `default`) n'est pas proposée dessus (aucune erreur).
- Pipeline (`engine/remote/release-options.ts`) : latest.yml → choix de la plateforme → lecture des liens (mis en cache pour le hors ligne) → validation de l'entrée résolue → rapport / installation. Un lien illisible invalide l'entrée (`latest.<niveau>.<entrée>.<option> : lien illisible`), jamais le launcher.

## Conservation et exclusion (par entrée du latest.yml)

| Clé | Effet |
| --- | --- |
| `gameFolderToPreserve` | fichiers/dossiers (relatifs à `path`) gardés à la mise à jour. `"chemin"` : toujours. `{ path, from }` : seulement si la version **installée** satisfait `from` (`>=1.2.0`, `>=1.0.0 <2.0.0`, `1.x`, `*`), sinon la nouvelle version écrase. Un fichier conservé mais absent est fourni. |
| `gameFolderToRemove` | supprimés avant la mise à jour, sauf ce qui est conservé ou ignoré |
| `to_ignore` | motifs (`*`, `**`, `?`) exclus du hash, de la vérification et du nettoyage : fichiers locaux que l'entrée ne possède pas |

## Hash

Le hash d'une entrée `hash_url` est le sha256 du manifeste `{ fichier: sha256 }` (hors `to_ignore`). Le générer :

```
yarn build:manifest <dossier-source> <dossier-sortie> --ignore logs
```

Il écrit `hash.json` + `hash/` et affiche le `hash` à reporter dans le `latest.yml`. Le launcher refuse un manifeste qui ne correspond pas au hash déclaré et un fichier dont le hash est faux.

## Mods Thunderstore

Chaque mod est extrait dans son propre dossier `<Auteur>-<Nom>` : plusieurs entrées (mods normaux, admin, boost FPS…) peuvent partager `game/BepInEx/plugins` sans se gêner. `modpack.json` d'une instance (tableau `Auteur-Nom-Version`) est à générer depuis le `manifest.json` du modpack à chaque release.

## Règles de lien

Une chaîne d'un paramètre remote est : `https://…` (URL), `/chemin` (relatif au serveur de fichiers), `data:…` (donnée, ex : image). Tout autre type de valeur est une donnée inline. `http://` n'est accepté qu'en développement.

## Tests

```
yarn test              # node:test via tsx
yarn typecheck:tests   # types du code et des tests
```

Le test `engine/remote/backend-files.test.ts` recoupe la config main et `backend/public` pour chaque jeu, canal et plateforme : index valide, dossier d'installation pour chaque entrée, hash des manifestes cohérents, fichiers liés présents.
