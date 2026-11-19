# Système d'instances

Une **instance** = un jeu (ou une variante d'un jeu) décrit par trois couches reliées par un `id` unique (ex : `Valheim-Valkream-v2`).

| Couche | Fichier | Contient |
| --- | --- | --- |
| Main | `frontend/main/src/instances/instances.config.ts` | serveur de jeu, lien de l'index, `allowedPaths` (liste blanche des chemins d'installation) |
| Render | `frontend/renderer/src/instances/instances.config.tsx` | nom, préfixe des assets, scène 3D, textes, liens, réglages (`customGamesSettings`, niveaux normal / special / danger), tableaux Debug |
| Remote | `backend/public/index.config.json` + `games/<id>/latest.yml` | activation par plateforme, versions, sources, hash, mods, contributeurs |

`draft-original/` garde le brouillon de départ, commenté (spécification des champs de `latest.yml`).

## État

- Fait : types partagés, règle de lien, validation de l'index et du `latest.yml`, résolveur avec cache disque, registre, confinement des chemins.
- Fait : **installation par canal** (`instances/<id>/stable|beta/`) avec état (`instance.state.json`) et réglages (`instance.settings.json`) propres à chaque canal : la beta n'a aucun fichier en commun avec le stable.
- Fait : **moteur d'installation** (`engine/InstanceInstaller.ts`) : providers `zip_url`, `hash_url`, `thunderstore_modpack_url` ; reprise par entrée ; une synchronisation à la fois par installation.
- Fait : **rapport** (`instances:report`) : un statut par entrée + récapitulatif « fonctionne ou non ».
- Fait : **UI 100 % générique** : choix du jeu, accueil (un seul `InstanceButton` : installer / réinstaller / mettre à jour / jouer, avec progression), réglages General / Launcher / Game / Mods (affichage joueur) / Dev (outils + Debug admin avec « Réparer »). Fonds image / vidéo / 3D, loader, liens et infos serveur lisent la config render de l'instance active.
- Fait : instances `Valheim-Valkream-v2` et `SevenDtoD-Valkream-v2` (7 Days to Die installé entièrement dans le launcher, comme Valheim).
- Fait : **une seule API** `window.electron_API` (`getInstances`, `getInstanceInfos`, `getInstanceStatus`, `getInstanceReport`, `syncInstance`, `launchInstance`, `openInstanceFolder`, `uninstallInstance`, `setInstanceSetting`, `onInstanceProgress`…). Les anciens managers, IPC, panneaux et API par jeu (`electron_Valheim_API`, `electron_SevenDtoD_API`) sont supprimés.
- Pas de migration des anciennes installations : réinstallation propre dans `instances/<id>/<canal>/` (les anciens dossiers ne sont pas touchés).
- Pas encore : provider Nexus (signalé comme échec), dépendances transitives Thunderstore.

## Ajouter un jeu

1. Une entrée dans `main/src/instances/instances.config.ts` (serveur, chemins, exécutable, `steamAppId`).
2. Une entrée dans `renderer/src/instances/instances.config.tsx` (assets dans `public/`, 3D, textes, réglages).
3. Une entrée dans `backend/public/index.config.json` et un `games/<id>/latest.yml`.

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

Le test `validate.test.ts` vérifie aussi que les fichiers d'exemple de `backend/public` restent valides.
