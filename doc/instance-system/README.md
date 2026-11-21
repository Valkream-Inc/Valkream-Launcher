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
backend/
  src/                            serveur statique (server.ts, app.ts, lib/request-log.ts)
  public/                         voir backend/public/README.md
    games/<id>-v2/                index.config.json, latest*.yml, config/, hash/
frontend/
  shared/types/                   types partagés main / renderer (.d.ts seulement)
  scripts/                        build-manifest, dev-main
  main/
    app.ts                        point d'entrée Electron
    src/
      core/                       services du launcher : constants, dirs, files, settings, launcher, server-infos
      lib/                        helpers techniques sans logique métier : database, http (fetch), download-file
                                  (reprise + watchdog), tar-extract (tar en flux), json-key (option `key`), archive-limits,
                                  safe-link, platform-dir, format-bytes, console-stream, paths, patterns, version
      windows/                    fenêtres (main, update) et preloads
      ipc/                        handlers IPC : launcher-ipc, instance-ipc, admin-tools-ipc (onglet Tools),
                                  sync-registry (une synchro par installation, annulation / relance), check-for-updates
      instances/                  tout ce qui concerne les jeux
        instances.config.ts       config main des instances (+ instances.types.d.ts)
        remote/                   lien, résolveur + cache, validation, options par plateforme / lien, registre, index
        install/                  installation : providers (zip, hash, thunderstore, archive, global-progress), conservation,
                                  hash, cache, état, staging, stream-extract (.tar.gz en flux), local-content (`local:`)
        tools/                    outils admin : hash-folder (hash + export), mods-list (liste de mods Thunderstore)
        local/                    état local : rapport (inspector), infos d'accueil, statut, lancement, chemins
        services.ts               assemble les services avec les dépendances réelles
      types/                      types du main (core, utils)
  renderer/src/
    instances/                    config render des instances + helpers
    windows/launcher/             contexts, composants, panneaux (home, settings, choose-games), theme/ (thèmes MUI)
```

## État

- Fait : types partagés, règle de lien, validation de l'index et du `latest.yml`, résolveur avec cache disque, registre, confinement des chemins.
- Fait : **installation par canal** (`instances/<id>/stable|beta/`) avec état (`instance.state.json`) et réglages (`instance.settings.json`) propres à chaque canal : la beta n'a aucun fichier en commun avec le stable.
- Fait : **moteur d'installation** (`instances/install/InstanceInstaller.ts`) : providers `zip_url`, `hash_url`, `thunderstore_modpack_url` ; reprise par entrée ; une synchronisation à la fois par installation.
- Fait : **rapport** (`instances:report`) : un statut par entrée + récapitulatif « fonctionne ou non ».
- Fait : **UI 100 % générique** : choix du jeu, accueil (un seul `InstanceButton` : installer / réinstaller / mettre à jour / jouer, avec progression), réglages General / Launcher / Game / Mods (affichage joueur) / Dev (outils du jeu : désinstaller, ouvrir le dossier…) / Tools (préparation du remote : hash d'un dossier, liste de mods) / Debug (diagnostic : récapitulatif, tableaux filtrables, réglages, journal d'installation, « Réparer »). Dev, Tools et Debug sont réservés aux admins. Fonds image / vidéo / 3D, loader, liens et infos serveur lisent la config render de l'instance active.
- Fait : instances `Valheim-Valkream-v2` et `SevenDtoD-Valkream-v2` (7 Days to Die installé entièrement dans le launcher, comme Valheim).
- Fait : **une seule API** `window.electron_API` (`getInstances`, `getInstanceInfos`, `getInstanceStatus`, `getInstanceReport`, `syncInstance`, `launchInstance`, `openInstanceFolder`, `uninstallInstance`, `setInstanceSetting`, `onInstanceProgress`…). Les anciens managers, IPC, panneaux et API par jeu (`electron_Valheim_API`, `electron_SevenDtoD_API`) sont supprimés.
- Fait : **réglages d'installation** : `instance.settings.json` contient tous les réglages (valeurs par défaut de l'instance incluses) dès le premier changement ; la lecture complète toujours avec les défauts.
- Pas de migration des anciennes installations : réinstallation propre dans `instances/<id>/<canal>/` (les anciens dossiers ne sont pas touchés).
- Pas encore : provider Nexus (signalé comme échec).

## Ajouter un jeu

1. Une entrée dans `main/src/instances/instances.config.ts` (serveur, chemins, exécutable, `steamAppId`).
2. Une entrée dans `renderer/src/instances/instances.config.tsx` (assets dans `public/`, 3D, textes, réglages).
3. Un dossier `backend/public/games/<id>/` avec son `index.config.json` (liens des latest stable / beta) et son `latest.yml`.

## Publier une version d'un jeu

1. Déposer les fichiers sur le serveur (zips à la racine du dossier de l'archive, ou dossier de fichiers + manifeste).
2. Pour une entrée `hash_url` : `yarn workspace Valkream-Launcher build:manifest <dossier-source> <sortie> --latest backend/public/games/<id>/latest.yml --entry game-base.<nom>` produit `hash.json` (à copier dans `games/<id>/hash/`) et écrit le `hash` de l'entrée dans le `latest.yml` (commentaires conservés). Sans `--latest`, le hash est seulement affiché. Optionnel : zipper le dossier et le déclarer en `zip` (installation complète plus légère).
3. Mettre à jour `latest.beta.yml`, tester avec l'option beta du launcher, puis reporter dans `latest.yml`.
4. Incrémenter la version `X0.X1.X2` (affichage seulement : la mise à jour se décide entrée par entrée via version + hash).

## Lancement : Steam et arguments

- **`steamAppId`** (config main) : sa présence active le réglage `launchSteam` (absent de l'interface pour un jeu sans app Steam) et le bouton « Page Steam du jeu » (`steam://store/<id>`). Avec `launchSteam` actif, le launcher **démarre Steam s'il ne tourne pas** (`steam://open/main`, puis attente de son démarrage, 30 s au plus et sans jamais bloquer le lancement) pour que la vérification de possession du jeu fonctionne, **puis lance l'exécutable de l'instance**. Un jeu sans `executable` déclaré est lancé par Steam (`steam://rungameid/<id>`).
- **`launchArgs`** (config main, déclinable par plateforme) : arguments passés à l'exécutable, éventuellement selon les réglages. Un argument est une chaîne (toujours, `{réglage}` remplacé par sa valeur) ou `{ when, equals?, args }` (ajoutés si le réglage est actif, ou égal à `equals`). Les arguments sont transmis en tableau, jamais via un shell.
- **`command`** : commande du PATH lancée à la place de `executable` (ex : `java`), avec `launchCwd` (dossier relatif à l'instance) ; le fichier du jeu passe dans `launchArgs`.
- **Curseur** (config render) : `{ type: "slider", settingsName: "ram", label, min, max, step, unit, default }` ; la valeur numérique est enregistrée au relâchement et utilisable dans `launchArgs`. Exemple pour un jeu Java :

```ts
// main
command: { win32: "java", linux: "java" },
launchCwd: "game",
launchArgs: ["-Xmx{ram}M", { when: "fullscreen", args: ["--fullscreen"] }, "-jar", "server.jar"],
defaultSettings: { ram: 4096, fullscreen: false },
// render : customGamesSettings
{ type: "slider", settingsName: "ram", label: "Mémoire max", min: 1024, max: 16384, step: 512, unit: "Mo", default: 4096 }
```

## Jeux Steam : ne pas héberger les fichiers du jeu

Héberger soi-même les fichiers d'un jeu commercial (`build-game-*.zip`) revient à le redistribuer : à éviter. Il vaut mieux que chaque joueur obtienne le jeu **par sa propre licence Steam**, et que le serveur ne porte que ce qui est à nous (mods, configs, BepInEx via Thunderstore). Trois façons d'obtenir une version précise :

1. **Branche bêta Steam (officiel, sans outil)** : Steam → clic droit sur le jeu → Propriétés → Bêtas. Si l'éditeur propose la version voulue (branche « legacy » / « previous version »), le joueur la choisit ; les fichiers sont dans `steamapps/common/<jeu>`. Le provider `steam_library` les copie dans l'instance (voir ci-dessous).
2. **DepotDownloader (version arbitraire, avec son compte)** : outil open source [SteamRE/DepotDownloader](https://github.com/SteamRE/DepotDownloader) qui télécharge un **manifeste précis** d'un depot avec le compte Steam du joueur (il doit posséder le jeu) :

```
DepotDownloader -app 892970 -depot <depotId> -manifest <manifestId> -username <compte> -remember-password -dir <dossier>
```

   `appId` / `depotId` / `manifestId` (un manifeste = une version du jeu) se trouvent sur [SteamDB](https://steamdb.info) (page du jeu → Depots → Manifests). Le premier lancement demande mot de passe et code Steam Guard ; `-remember-password` évite de les redemander. Options utiles : `-filelist` (ne télécharger que certains fichiers), `-os windows|linux|macos`, `-beta <branche>`.
3. **Copie depuis l'installation Steam du joueur (implémentée : `steam_library`)** : si le joueur a déjà le jeu, le launcher copie `steamapps/common/<jeu>` (dossier retrouvé via `libraryfolders.vdf` et `appmanifest_<appId>.acf`, qui contient le `buildid`) dans l'instance, puis appliquer nos mods par-dessus. Aucun identifiant Steam n'est manipulé par le launcher.

### Provider `steam_library`

```yaml
game-base:
  valheim:
    version: 0.221.12
    type: steam_library
    buildid: 17000000          # optionnel : build Steam attendu (affiché dans l'erreur si la version diffère)
    content: /games/Valheim-Valkream-v2/hash/game.json   # manifeste { fichier: sha256 } du jeu (`build:manifest`)
    to_ignore: [logs]
    # hash-folder: /games/.../files/   # facultatif : fichiers à NOUS absents de Steam ou modifiés
```

Le `steamAppId` vient de la config main. Les fichiers du manifeste sont copiés depuis le dossier du jeu dans la bibliothèque Steam du joueur (retrouvé via `libraryfolders.vdf` et `appmanifest_<id>.acf`, sous Windows via le registre) ; chaque fichier est vérifié par son hash et le dossier Steam n'est **jamais modifié**. Sans `hash-folder`, un fichier absent ou d'une autre version fait échouer l'entrée avec un message explicite (build installé / attendu, fichiers en cause, et la marche à suivre : Propriétés → Bêtas dans Steam). Ne mettez dans le manifeste que les fichiers du jeu ; vos mods et configs passent par les autres entrées (`zip_url`, Thunderstore). `content` accepte les mêmes formes que `hash_url` (`key`, `local:`). Le rapport vérifie l'entrée comme un `hash_url`.

### Jeu absent ou autre version : trois solutions proposées au joueur

Quand `steam_library` échoue (jeu introuvable ou fichiers d'une autre version), la synchronisation renvoie un `steamIssue` et l'interface ouvre un dialogue :

1. **Mode d'emploi Markdown** (généré : builds attendu / installé, fichiers en cause, branche `steam-beta` à choisir dans Propriétés → Bêtas, lien `steam://`) ;
2. **Localiser l'installation** : le joueur choisit un dossier (autre disque, copie…). Il est mémorisé dans `instance.source.json`, prioritaire sur Steam, lu seulement ;
3. **DepotDownloader** (si l'entrée déclare `depot`) : version exacte téléchargée depuis Steam, connexion **par QR code** scanné avec l'application mobile Steam (le QR s'affiche dans le dialogue ; le launcher ne voit ni mot de passe ni Steam Guard). Le jeu est déposé dans `<installation>/.depot/game`, puis l'installation est relancée et supprime ce dossier une fois tout copié et vérifié.

```yaml
    steam-beta: public-test            # optionnel : branche bêta citée dans le mode d'emploi
    depot: { id: 892971, manifest: "1234567890123456789" }   # active la solution 3 (par plateforme possible)
```

**Fichiers parasites (BepInEx déjà installé, mods, sauvegardes)** : seuls les fichiers listés dans le manifeste sont copiés, chacun vérifié par son hash ; le reste du dossier source est ignoré et jamais modifié. Le manifeste doit donc être calculé sur une **installation propre** de la bonne version (`build:manifest` ou onglet Tools → Hash folder), `to_ignore` couvrant les fichiers locaux. Si BepInEx modifie un fichier du jeu présent dans le manifeste, il sera signalé comme version différente : ne gardez dans le manifeste que les fichiers du jeu d'origine.

**DepotDownloader : à configurer par un administrateur.** `main/src/instances/install/depot-config.ts` doit contenir, par plateforme (`win32-x64`, `linux-x64`…), l'URL du zip de la release officielle et son **sha256** (non fournis : ils ne peuvent pas être inventés). Le launcher télécharge ce zip, vérifie le sha256 **avant** extraction, mémorise le hash de l'exécutable et le revérifie avant chaque lancement. Sans entrée pour la plateforme, la solution 3 n'est pas proposée.

**Mise à jour de DepotDownloader** : `yarn depot:pin <tag>` (ex : `DepotDownloader_3.4.0`, `--list` pour voir les assets) télécharge les zips officiels reconnus, calcule leur sha256 et réécrit `depot-config.ts`. Après publication du launcher, la nouvelle version est téléchargée et vérifiée au premier usage ; les anciennes sont supprimées. Les hashes restent dans le code du launcher (pas dans le remote) : un serveur compromis ne peut pas imposer un binaire.

**Migrer un jeu vers `steam_library`** (ex : 7 Days to Die) : sur une installation Steam propre de la bonne version, `yarn build:manifest <dossier-du-jeu> <sortie> --manifest-only --ignore <motifs locaux> --latest latest.yml --entry game-base.sevendtod` écrit seulement `hash.json` (aucun fichier du jeu copié) et le `hash` de l'entrée. Servez `hash.json`, puis passez l'entrée en `type: steam_library` avec `content` pointant dessus, et retirez les zips du jeu du serveur.

Règles de sécurité appliquées : pas de mot de passe côté launcher (QR, stdin fermé, aucun `-username` / `-password`) ; `appId` pris dans la config main, `depot` / `manifest` strictement numériques, arguments en tableau (pas de shell), dossier de sortie forcé dans l'installation ; le dossier téléchargé n'est pas cru : chaque fichier est vérifié par le manifeste de hash. Un écran d'information (outil, version, emplacements, QR, vérifications) s'affiche avant la première utilisation.

Dans tous les cas le serveur n'héberge plus que nos fichiers (zip de config, mods Thunderstore).

Ce document n'est pas un avis juridique : le contrat d'abonné Steam et les conditions de l'éditeur du jeu font foi (par exemple, ne jamais partager son compte ni distribuer les fichiers téléchargés).

## Installation atomique et reprise

- **Atomique par entrée** : chaque provider (`zip_url`, `hash_url`, Thunderstore) télécharge, vérifie et extrait d'abord dans `.tmp/<entrée>.stage`. Ce n'est qu'une fois tout prêt que `gameFolderToRemove` est appliqué et que les fichiers sont basculés dans le dossier du jeu par renommages (`install/staging.ts`). Une erreur, une annulation ou un hash invalide pendant la préparation laisse l'installation exactement dans son état précédent. La bascule elle-même (quelques renommages) n'est pas transactionnelle : une coupure à cet instant précis est rattrapée par « Vérifier / Réparer ». L'espace disque temporaire nécessaire est celui des fichiers à mettre à jour (ou de l'archive et de son extraction).
- **Reprise HTTP** : un téléchargement interrompu (annulation, coupure, fermeture du launcher) est repris à la synchronisation suivante (`Range` + `If-Range`), à condition que l'URL soit la même et que le serveur annonce un `ETag` ou `Last-Modified` inchangé ; sinon il repart de zéro. Les partiels sont gardés 7 jours dans `.tmp` (`*.zip`, `*.part`, `*.meta`) et supprimés dès qu'une synchronisation réussit.

## Annulation, espace disque, journal

- **Annulation** : le bouton « Annuler » de l'accueil interrompt la synchronisation du canal en cours (`cancelInstanceSync`). Une annulation n'est pas un échec : `InstanceSyncResult.cancelled` vaut `true` et l'entrée interrompue reprendra à la prochaine synchronisation.
- **Espace disque** : `requiredSpaceMb` (optionnel, dans l'`index.config.json`) est l'espace libre minimal exigé avant une *première* installation du jeu ; la valeur est une estimation à ajuster.
- **Journal** : `instance.log` (dans le dossier du canal) note le début, la fin et les erreurs de chaque entrée.
- **Sécurité** : les archives sont refusées au-delà de 200 000 fichiers ou 100 Go décompressés ; les liens externes sont limités à http, https et steam.

## Format du latest.yml

- Version globale `X0.X1.X2` (affichage seulement) : X0 saison, X1 `game-base`, X2 `game-details`.
- Deux niveaux, **tous deux forcés** : `game-base` (le jeu, réinstallation complète si en retard) et `game-details` (mods, configs, détails, mise à jour incrémentale). Le jeu n'est jouable en ligne que lorsque tout ce qui est actif est à jour ; hors ligne, on joue ce qui est installé. Les anciens `game-breaking` / `game-notbreaking` sont réunis sous `game-details`.
- **Toutes les options d'une entrée sauf `version`** (`path`, `type`, `hash`, `content`, `key`, `hash-folder`, `zip`, `folder_in_zip`, `api-url`, `gameFolderToRemove`, `gameFolderToPreserve`, `to_ignore`, `optional`) :
  - peuvent être déclinées par plateforme : `{ win32: …, linux: …, darwin: …, default: … }` ;
  - prennent une valeur **inline**, un **chemin relatif** (`/chemin`, racine du serveur de fichiers) ou une **URL** (`https://…`) vers un fichier JSON/YAML qui contient la valeur. Le fichier lié peut lui-même être décliné par plateforme.
  - Une chaîne qui commence par `/` est donc un lien : `path` et `folder_in_zip` s'écrivent sans `/` initial.
  - Exceptions : `content` (archive, manifeste, liste), `hash-folder` et `api-url` sont déjà des liens vers ce que le provider télécharge : seule leur plateforme est choisie.
  - Une entrée dont `path`, `type` ou `content` n'a pas de valeur pour la plateforme (ni `default`) n'est pas proposée dessus (aucune erreur).
- Pipeline (`instances/remote/release-options.ts`) : latest.yml → choix de la plateforme → lecture des liens (mis en cache pour le hors ligne) → validation de l'entrée résolue → rapport / installation. Un lien illisible invalide l'entrée (`latest.<niveau>.<entrée>.<option> : lien illisible`), jamais le launcher.

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

### Archive `zip` (installation complète)

Une entrée `hash_url` peut déclarer `zip: <lien>` : une archive de **tous** les fichiers du manifeste (mêmes chemins relatifs, `folder_in_zip` si ils sont dans un sous-dossier). Quand plus de la moitié des fichiers est à récupérer (première installation), le launcher télécharge l'archive en une fois (compressée) au lieu des fichiers un par un. Chaque fichier extrait est quand même vérifié par son hash ; un fichier absent de l'archive ou au mauvais hash est repris individuellement via `hash-folder`. Pour une simple mise à jour, l'archive n'est pas utilisée. Exemple : `cd <dossier-source> && zip -r ../all.zip . -x 'logs/*'`, puis `zip: /games/<id>/latest/all.zip`.

### Cache des hash

Les hash des fichiers installés sont mémorisés dans `instance.hashes.json` (à côté de `instance.state.json`), avec la taille et la date de chaque fichier : la vérification d'une installation ne relit que les fichiers modifiés depuis. La réparation (`repair`) ignore ce cache et relit tout le disque.

## Mods Thunderstore

`dependencies: { skip?: [Auteur-Nom] }` (optionnel) active la résolution des dépendances transitives : après extraction, le `manifest.json` de chaque mod est lu et ses dépendances sont installées à leur tour (une version par mod : la première rencontrée, la liste de l'entrée d'abord ; les cycles sont gérés). `skip` liste les dossiers jamais installés comme dépendance, typiquement le pack BepInEx déjà fourni par le jeu. Sans `dependencies`, la liste de l'entrée doit être complète.

Le contenu d'une entrée Thunderstore (`content`) peut être : une liste inline `[Auteur-Nom-Version, …]`, un lien vers un JSON (avec `key` pour désigner la liste à l'intérieur, ex : `dependencies.mods`) ou `local:<entrée>/<fichier>` (liste livrée dans une autre entrée, voir plus bas). L'API Thunderstore expose aussi, par version de mod, `https://thunderstore.io/api/experimental/package/<Auteur>/<Nom>/<version>/` dont le champ `dependencies` est la liste des dépendances directes : `content: <cette URL>` + `key: dependencies` l'utilise directement (API « experimental » : à vérifier avant usage, il n'existe pas d'URL qui renvoie le `manifest.json` brut seul).

Chaque mod est extrait dans son propre dossier `<Auteur>-<Nom>` : plusieurs entrées (mods normaux, admin, boost FPS…) peuvent partager `game/BepInEx/plugins` sans se gêner. `modpack.json` d'une instance (tableau `Auteur-Nom-Version`) est à générer depuis le `manifest.json` du modpack à chaque release : l'onglet Tools (Liste de mods) fait aussi l'aperçu avec images pour `mods.config.json`.

## Règles de lien

Une chaîne d'un paramètre remote est : `https://…` (URL), `/chemin` (relatif au serveur de fichiers), `data:…` (donnée, ex : image). Tout autre type de valeur est une donnée inline. `http://` n'est accepté qu'en développement.

## Tests

```
yarn test              # node:test via tsx
yarn typecheck:tests   # types du code et des tests
```

Le test `instances/remote/backend-files.test.ts` recoupe la config main et `backend/public` pour chaque jeu, canal et plateforme : index valide, dossier d'installation pour chaque entrée, hash des manifestes cohérents, fichiers liés présents.

## Option `key` (données dans un fichier JSON lié)

Quand `content` d'un `hash_url` ou d'un `thunderstore_modpack_url` est un lien vers un fichier JSON, `key` indique où se trouvent les données dans ce fichier : chemin pointé, `.` (défaut, le fichier entier) ou index de tableau. Exemple : `content: /games/<id>/modpack.json` + `key: dependencies.mods` lit la liste `modpack.json → dependencies.mods`. Pour `hash_url`, le hash de l'entrée est calculé sur le contenu désigné. Clé introuvable : l'entrée échoue avec un message clair. Déclinable par plateforme comme les autres options.

### Contenu local : `local:<entrée>/<fichier>`

`content` d'un `hash_url` ou d'un `thunderstore_modpack_url` peut désigner un fichier déjà installé par une autre entrée plutôt qu'un lien distant. Exemple : la liste des mods de base est livrée dans le zip de config :

```yaml
game-details:
  cfg:
    version: 3
    type: zip_url
    content: /games/valheim/config.zip
    folder_in_zip: config          # config/modpack.json → <dossier de cfg>/modpack.json
  mods:
    version: 3                     # à incrémenter aussi quand modpack.json change
    type: thunderstore_modpack_url
    content: local:cfg/modpack.json
    key: dependencies.mods
```

Le dossier de `cfg` vient de la config main (`entryPaths`) : le remote ne choisit jamais un chemin. L'entrée source doit être déclarée **avant** (elle est installée d'abord) ; sinon l'entrée échoue avec « l'entrée « cfg » doit être installée avant ». Comme le launcher ne sait pas à l'avance que le fichier a changé, la `version` de l'entrée qui le lit se change en même temps que celle de la source.

### Un zip, plusieurs dossiers d'installation

Une archive peut contenir un dossier par chemin d'installation : déclarez une entrée par chemin (le chemin de chaque entrée est dans la config main), avec le **même** `content` et un `folder_in_zip` différent. L'archive `.zip` n'est téléchargée qu'une seule fois par synchronisation et supprimée après sa dernière utilisation. (Une archive `.tar.gz` est lue en flux : elle n'est pas mise en cache, privilégiez le zip dans ce cas.)

La résolution des dépendances **transitives** Thunderstore reste désactivée par défaut : elle n'existe que si l'entrée déclare explicitement `dependencies` (avec `skip` en option). Sans elle, la liste de `content` est installée telle quelle.

## Réseau et robustesse

- Un seul client HTTP : `fetch` natif (`main/src/lib/http.ts`, `lib/download-file.ts`). Le téléchargeur reprend (Range / If-Range), coupe un flux muet après 30 s d'inactivité puis reprend, et n'insiste pas sur une 4xx.
- `ipc/sync-registry.ts` : une synchro par installation ; relancer une installation bloquée ou plantée annule l'ancienne et repart aussitôt (les partiels sont repris). Tout est coupé à la fermeture ou sur erreur non gérée.
- **Archives `.tar.gz` / `.tgz`** (`content` d'un `zip_url`, ou `zip` d'un `hash_url`) : téléchargement, gunzip et extraction se font en un seul flux (`install/stream-extract.ts`, `lib/tar-extract.ts`), sans archive sur le disque ; `folder_in_zip`, conservation/exclusions, limites et protection contre les chemins hors destination s'appliquent comme pour un zip. Pas de reprise HTTP : une coupure relance l'extraction (3 tentatives). Les `.zip` gardent téléchargement avec reprise, puis extraction avec progression.
- **Progression globale** : `hash_url` et Thunderstore affichent un seul pourcentage pour toute l'entrée (cumul d'octets, débit moyen, jamais de nom de fichier ni de mod ; `providers/global-progress.ts`).
- **Progression** : événements limités à 4 par seconde (`PROGRESS_INTERVAL_MS`), champ `elapsedMs` ; le bouton de l'accueil affiche un chronomètre ⏱ (horloge locale, mise à jour chaque seconde) en plus du pourcentage.

## Onglet Tools (admin)

- **Hash d'un dossier** : choix du dossier par dialogue, motifs `to_ignore` optionnels → `hash` du latest.yml, `hash.json` (copier / enregistrer), export `hash.json` + `hash/` prêt pour le backend. Même algorithme que `scripts/build-manifest.ts` (`instances/tools/hash-folder.ts`).
- **Liste de mods depuis un manifest** : dépendances Thunderstore (une par ligne, tableau JSON ou lien) → `ModDisplay[]` avec image, description et lien (API Thunderstore), aperçu, copie / enregistrement pour `mods.config.json` (`instances/tools/mods-list.ts`).


## Dossier d'installation, versions du launcher et mises à jour

- **Dossier des jeux modifiable** (réglage général « Dossier d'installation des jeux ») : enregistré dans `launcher-paths.json` (données du launcher). Le déplacement est **atomique** : `rename` sur un même volume ; sur un autre disque, copie complète dans `instances.moving` puis `rename` final, et l'ancien dossier n'est supprimé qu'après. La config ne change qu'après un déplacement réussi ; un échec ou un arrêt brutal laisse l'ancien emplacement valide (les restes sont nettoyés au démarrage). Refusé si une installation est en cours, si le dossier cible n'est pas vide ou est imbriqué.
- **Chemin d'une entrée modifié** (`entryPaths` de la config main) : le launcher mémorise le dossier de chaque entrée à l'installation. S'il change entre deux versions, l'entrée est réinstallée au nouvel endroit (installation complète) et ce qu'elle possédait à l'ancien endroit (mods listés) est retiré. Si le chemin ne change pas, rien n'est refait. Un état ancien sans chemin mémorisé n'est pas réinstallé.
- **Changement de version majeure du launcher** : au démarrage (hors dev), le contenu des installations est supprimé pour une réinstallation propre ; seuls les réglages du joueur (`instance.settings.json`) sont conservés. Les versions mineures / correctifs ne suppriment rien. La version précédente est mémorisée dans `launcher-version.json`.
- **Contournement de la mise à jour du launcher** : Ctrl + Maj + clic sur la vidéo de démarrage ouvre directement le launcher. Le mode beta ne désactive plus la mise à jour.

## Traduction (fr / en)

Interface traduite avec **i18next** + **react-i18next** : `frontend/renderer/src/i18n/` (`fr.ts` = référence, `en.ts`, `index.ts`). La langue est le réglage général `language` (Paramètres → Langue ; défaut : langue du système, français sinon anglais), chargée avant le premier rendu. Dans un composant : `const { t } = useTranslation(); t("settings.music.on")` ; variables `t("games.none", { search })`. Hors composant : `i18n.t(...)`.

Ajouter un texte : l'écrire dans `fr.ts` ET `en.ts` (même clé, mêmes variables `{{x}}`) ; `i18n.test.ts` échoue sinon. Le mode d'emploi Steam est généré côté main dans la langue du réglage.

Pas encore traduits (français uniquement) : onglets Debug / Tools / Dev (outils admin), messages d'erreur et de progression venant du processus main, textes propres à chaque jeu (`instances.config.tsx` : descriptions, astuces, bienvenue), fenêtre de mise à jour (messages du main).
