# TODO

## Packages prioritaire a faire dans l'ordre susivant (4 --> 1 --> 3 --> 2)

- 1 : [ ] (?) transformer les different theme en vraie theme mui (base faite : `windows/launcher/theme/mui-themes.ts` ; reste à migrer les CSS des thèmes modern, old puis futuristic)
- 2 : [ ] (?) migrer l'application vers TAURI
- 3 : [ ] (?) rajouter un chemin d'installation par défaut/ que l'on demandera de modifier ou non au premier démarrage via un panel "info", et un qelecteur de fichier (l'installeur devra lire un flag avec le chmin pour pouvoir suprimer ce path lors de la déinstallation). Il faudra également gérer le changemment de ROOTPATH via les générals settings.
- 4 : [x] (fait : voir doc/instance-system/README.md) il faudra revoir la structure de gestion des jeux cf ce prompt : Salut regarde ma repo ValkreamLauncher dans l'organisations Valkream-Inc et fait moi un plan d'actions détaillé pour avoir un system de gestion des jeux plus propre et adaptable ...
  je veux pouvoir crée des nouveaux jeux ou d'autres instances du meme jeux sans code redondant il faudrai donc une config dans le main electron pour chaue instance avec toute les infos frontend et un 1 pr le backend avec toute les infos backend ip id nom, et aussi un system de paramétre via le backend ex: on peut définir une liste de mod ou un url ou un chemin relatif ou en core la mettre en dur dans le code du backend ... il faut que les pattern se basse sur une installation de type base (réinstallation) avec des chemin relatif aux root path l'id ? et des liens vers des zip ou vers la config online etc... puis le pattern pour chaque sous lien qui change avec les update definir un ou plusieurs pattern pour des sous path (ils ne doivent pas posser de probléme entre eux) ex dans /mods/ nexus + thunderstore + d'autre patern etc... il faut que le pattern de type base utilise un system de hash enfin il faut une liste de mod et de contributeur via la config backend ? pour chaque instance pour l'affichage dans l'onglet mods et un onglet debug avec les tableaux associés a chaque pattern pour chaque sub path et un tableau recap qui montre si ca fonctionne ou non... il faut également que le system de beta soit pris en compte dans une installation local séparré

## Pour plus tard

- [ ] (++) optimize performance in TreeJs (3d ..?)
- [ ] (++) optimize base fonction (trottle, etc.)
- [x] ~~http2 / remplacer axios~~ : `fetch` natif (lib/http.ts + lib/download-file.ts)
- [x] (fait) hash à l'installation, reprise par entrée, vérification via hash, cache `instance.hashes.json`
- [x] (fait) doc : README racine, frontend, backend, doc/instance-system

## Propositions d'amélioration

Légende : (+) petit · (++) moyen · (+++) gros. Classées par thème.

### Moteur d'installation
- [x] (++) Provider `steam_library` : copie du jeu depuis l'installation Steam du joueur (`libraryfolders.vdf`, `appmanifest_<id>.acf`, hash par fichier, `buildid` dans l'erreur). Reste : l'utiliser pour Valheim / 7DtD (manifeste du jeu à générer avec `build:manifest`) et retirer les zips hébergés.
- [x] (++) Jeu absent / autre version : dialogue à 3 solutions (mode d'emploi Markdown, dossier choisi `instance.source.json`, DepotDownloader par QR code `depot-*.ts`). Reste : renseigner `depot-config.ts` (url + sha256 des releases officielles), écran d'information avant la première utilisation, tester avec le vrai DepotDownloader (format du QR, codes de sortie), rendu Markdown du dialogue à valider visuellement.
- [ ] (++) Provider Nexus (`nexus_url`) : aujourd'hui une entrée Nexus est un échec explicite.
- [x] (++) Dépendances Thunderstore transitives (résoudre et installer les dépendances d'un mod). — fait : option `dependencies: { skip }` par entrée (à activer dans les latest.yml si voulu).
- [ ] (++) Script `build-manifest --zip` / `--tar.gz` : générer aussi l'archive d'une entrée `hash_url` (le launcher sait déjà installer un `.tar.gz` en flux).
- [x] (++) Installation `.tar.gz` en flux (décompression pendant le téléchargement), progression d'extraction, progression globale (hash / Thunderstore), temps écoulé.
- [x] (+) Option `key` (données dans un JSON lié), contenu `local:<entrée>/<fichier>`, archive partagée entre entrées.
- [x] (++) Téléchargements parallèles (limités à 3-4) pour le provider `hash_url` + reprise d'un téléchargement interrompu (HTTP Range). — fait : 4 fichiers en parallèle (`runPool`) ; reprise HTTP `Range`/`If-Range` entre deux synchronisations faite.
- [x] (++) Installation atomique : extraire dans un dossier temporaire puis basculer, pour ne jamais laisser un jeu à moitié mis à jour. — fait : préparation dans `.tmp/<entrée>.stage` puis bascule par renommages.
- [x] (+) Annulation propre d'une installation en cours depuis l'interface (le `signal` existe déjà côté moteur). — fait : bouton « Annuler » (`cancelInstanceSync`), `cancelled` dans le résultat.
- [x] (+) Vérifier l'espace disque disponible avant une installation. — fait : `requiredSpaceMb` dans l'index (première installation) ; valeurs actuelles = estimations à ajuster.
- [ ] (+++) Mise à jour différentielle des gros fichiers (bsdiff / zstd) pour les mises à jour de jeu.

### Backend / publication
- [x] (++) Script de publication : copie des fichiers, calcul des hash, mise à jour du `latest.yml` et de la version `X0.X1.X2` en une commande. — fait : `build-manifest --latest <latest.yml> --entry <niveau.nom>` écrit le hash dans le latest.yml ; reste à automatiser la version `X0.X1.X2` et la copie des fichiers.
- [x] (++) Test CI qui valide `backend/public` (déjà couvert par `backend-files.test.ts` : l'exécuter dans le workflow GitHub à chaque push). — fait : `.github/workflows/ci.yml` (tests + typecheck + lint non bloquant) ; `backend-files.test.ts` est inclus dans `yarn test`.
- [ ] (+) Signature des manifestes (ou des `latest.yml`) pour ne pas dépendre uniquement de HTTPS.
- [ ] (+) Versionner les anciens `latest.yml` pour pouvoir revenir en arrière (rollback d'une version).
- [ ] (++) Dockerfile du backend + en-têtes de cache (ETag, `Cache-Control`) adaptés aux gros fichiers.

### Launcher / UX
- [x] (++) Lancement : `launchSteam` démarre Steam avant le jeu (réservé aux jeux avec `steamAppId`), arguments d'exécutable selon les réglages (`launchArgs`, `command`), réglage curseur.
- [ ] (+) Page de réglages : aperçu de la ligne de commande effective (admin / Debug).
- [x] (++) Onglet Tools admin : hash d'un dossier (+ export), liste de mods Thunderstore avec images.
- [ ] (+) Onglet Tools : champ « source Thunderstore » (`Auteur/Nom/Version` → liste des dépendances), génération du `latest.yml` / écriture du hash dans le latest.
- [ ] (++) Page Mods plus riche : recherche, filtres par catégorie, version installée vs disponible.
- [x] (++) Onglet Debug : export du rapport (JSON) pour le support, bouton « copier les erreurs ». — fait : boutons « Copier le rapport » (JSON) et « Copier le journal ».
- [x] (+) Journal d'installation consultable (fichier de log par instance et par canal). — fait : `instance.log` par canal (début / fin / erreur de chaque entrée) ; affichage dans l'interface à faire.
- [ ] (+) Gestion de plusieurs instances du même jeu côté interface (choix, duplication, suppression avec taille occupée).
- [ ] (++) Accessibilité : navigation clavier, contraste des thèmes, réduction des animations (`prefers-reduced-motion`).
- [ ] (+) Internationalisation (fr/en) : textes aujourd'hui en dur dans la config render et les composants.
- [ ] (++) Mode hors ligne explicite : bandeau « dernière version connue » quand seul le cache disque répond.

### Code et qualité
- [ ] (++) Migration des CSS des thèmes vers MUI, thème par thème (modern → old → futuristic) avec contrôle visuel.
- [ ] (++) Tests du renderer (contexts, `InstanceSettings`, `InstanceButton`) avec Testing Library ; aujourd'hui seuls le main et le moteur sont testés.
- [x] (+) Lint et `typecheck` dans le workflow CI avant le build des installeurs. — fait : job `verify` de `ci.yml`.
- [ ] (+) Découper `launcher-ipc` / `instance-ipc` par domaine et typer les canaux IPC de bout en bout (un seul fichier de contrat dans `shared/types/ipc.d.ts`).
- [x] Remplacer `axios` + `progress-stream` + `stream-throttle` par `fetch` (fait ; **lancer `yarn install` et committer yarn.lock** : sans cela la CI en `--immutable` échoue).
- [ ] (+) Renommer `windows/launcher/component` en `components` (cohérence) et ranger les CSS à côté de leur composant.
- [ ] (++) Tests de bout en bout du launcher (Playwright + Electron) sur le backend de dev : installation complète, mise à jour, réparation.

### Sécurité
- [ ] (+) Fenêtres Electron : `contextIsolation` et `nodeIntegration: false` sont déjà en place ; reste `sandbox`, CSP stricte. `openLink` est validé (`lib/safe-link.ts` : http, https, steam, sans identifiants).
- [x] (+) Limiter la taille et la profondeur des archives extraites (protection contre les zip-bombs) en plus du confinement des chemins. — fait : `lib/archive-limits.ts` (fichiers et taille décompressée vérifiés avant extraction).
- [ ] (+) `yarn audit` / Dependabot sur les dépendances du launcher.
