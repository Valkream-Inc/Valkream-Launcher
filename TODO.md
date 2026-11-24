# TODO

Seules les tâches **ouvertes** sont listées. Légende : (+) petit · (++) moyen · (+++) gros.

## À faire avant la prochaine release

- [ ] `yarn depot:pin <tag>` : renseigner `instances/install/depot/depot-config.ts` (URL + sha256 de DepotDownloader).
- [ ] Migrer vers `steam_library` : Valheim alpha est fait (`hash/alpha-game.json`, `depot` renseigné) ; reste Valheim stable / beta et 7 Days to Die (manifeste depuis une installation Steam propre : `yarn build:manifest … --manifest-only`), puis retirer les zips hébergés.
- [ ] Valider dans Electron : zoom, barre d'outils, défilement, pastilles de portée, canaux, déplacement du dossier des jeux (dont entre deux disques), pagination, fond 3D chargé à la demande, installeur NSIS (jamais compilé ici).
- [ ] Lancer `yarn build` complet : `check:build` et `check:runtime` (démarrage Electron) n'ont jamais tourné sur un vrai build.

## Moteur d'installation et publication

- [ ] (+++) Mise à jour différentielle des gros fichiers (bsdiff / zstd).
- [ ] (++) `build-manifest --zip` / `--tar.gz` : générer aussi l'archive d'une entrée `hash_url`.
- [ ] (+) Signature des manifestes (ou des `latest.yml`) pour ne pas dépendre uniquement de HTTPS.
- [ ] (+) Versionner les anciens `latest.yml` (rollback d'une version).
- [ ] (++) Dockerfile du backend + en-têtes de cache (ETag, `Cache-Control`) pour les gros fichiers.
- [ ] (+) Version majeure du launcher : option de conserver aussi les dossiers `gameFolderToPreserve`.

## Launcher / interface

- [ ] (+) Réglages : aperçu de la ligne de commande effective (admin / Debug).
- [ ] (+) Onglet Tools : champ « source Thunderstore » (`Auteur/Nom/Version` → dépendances) et écriture du hash dans le `latest.yml`.
- [ ] (++) Page Mods : recherche, filtres par catégorie, version installée vs disponible.
- [ ] (+) Plusieurs instances du même jeu : choix, duplication, suppression avec taille occupée.
- [ ] (++) Accessibilité : clavier, contraste des thèmes, `prefers-reduced-motion`.
- [ ] (++) Mode hors ligne explicite : bandeau « dernière version connue » quand seul le cache répond.
- [ ] (++) Migrer les CSS des thèmes vers MUI (modern → old → futuristic), avec contrôle visuel (base : `windows/launcher/theme/mui-themes.ts`).
- [x] Chemin d'installation demandé au premier démarrage : à valider dans Electron (panneau, choix d'un autre disque, rechargement).

## Code, tests, sécurité

- [ ] (++) Tests du renderer (contexts, `InstanceSettings`, `InstanceButton`) avec Testing Library.
- [ ] (++) Tests de bout en bout (Playwright + Electron) sur le backend de dev : installation, mise à jour, réparation.
- [ ] (+) Découper `launcher-ipc` / `instance-ipc` par domaine et typer les canaux IPC de bout en bout (`shared/types/ipc.d.ts`).
- [ ] (+) Fenêtres Electron : activer `sandbox` et une CSP plus stricte.
- [ ] (+) `yarn audit` / Dependabot.
- [ ] (+) Nombres et unités (« Mo ») de la progression : localiser le format.

## Propositions (à trier)

### Fiabilité des installations
- [ ] (++) Bouton « Réparer » proposé automatiquement quand le rapport détecte un fichier modifié ou manquant (aujourd'hui : onglet Debug seulement).
- [ ] (+) Vérification d'intégrité en arrière-plan après une mise à jour du jeu (hash des fichiers critiques) avec notification discrète.
- [ ] (+) Reprise après coupure de la bascule atomique : écrire un petit journal « bascule en cours » pour que « Vérifier » sache quoi terminer.
- [ ] (++) Test d'installation complète sur un faux serveur local (backend de dev + faux zips) dans la CI : installation, mise à jour, annulation, reprise.

### Performance
- [ ] (++) Fond 3D : réduire la définition et le nombre de particules selon la machine (`navigator.hardwareConcurrency`), pause quand la fenêtre est masquée ou minimisée.
- [ ] (+) Vidéos des jeux : poster + chargement différé, formats plus légers (WebM/AV1) pour alléger l'installeur (les 3 vidéos et 2 modèles 3D pèsent le plus).
- [ ] (+) Mesurer le temps de démarrage (fenêtre visible, premier panneau) et le garder sous un budget vérifié dans la CI.
- [ ] (+) Analyseur de bundle Vite (`rollup-plugin-visualizer`) pour repérer les modules lourds du renderer (MUI icons importés un par un).

### Build et release
- [ ] (+) CI : lancer `yarn check:build` et `yarn check:runtime` sur chaque PR (aujourd'hui seulement dans le workflow de build).
- [ ] (++) Signature de code Windows de l'installeur (SmartScreen) et publication automatique des notes de version.
- [ ] (+) Dependabot / Renovate groupé (renderer, outils de build, main) pour garder un `yarn.lock` à jour.
- [ ] (+) `yarn knip` (ou équivalent) en CI : détecte fichiers, exports et dépendances inutilisés avant qu'ils s'accumulent.

### Documentation
- [ ] (+) Schéma JSON de `index.config.json` et du `latest.yml` (`$schema`) : autocomplétion et validation dans VS Code pour les admins.
- [ ] (+) Commande `yarn new:game <id>` qui génère les trois fichiers de config d'un jeu à partir des exemples.
- [ ] (+) Page « Dépannage joueur » (jeu qui ne se lance pas, Steam introuvable, dossier non vide, pare-feu) liée depuis le launcher.

### Interface et accessibilité
- [ ] (+) Export / import des réglages du launcher (support et changement de PC).
- [ ] (+) Raccourcis clavier (Entrée = Jouer, Échap = retour) et focus visible sur tous les boutons.
- [ ] (++) Notifications de fin d'installation quand le launcher est en arrière-plan.

## Idées de fonctionnalités

### Pour les joueurs
- [ ] (++) Profils de mods : activer / désactiver des groupes (ex : « boost FPS », « graphismes ») avec aperçu de l'espace et du gain, sans réinstaller (base : entrées `optional`).
- [ ] (++) Sauvegarde et restauration des mondes / configs avant chaque mise à jour du jeu (zip daté, 3 dernières conservées).
- [ ] (+) Restauration de la version précédente d'une entrée après une mise à jour qui pose problème (rollback local).
- [ ] (++) Journal des changements (changelog) affiché avant la mise à jour : généré depuis le `latest.yml` ou un `changelog.json` du remote.
- [ ] (+) Statut du serveur enrichi : liste des joueurs en ligne, historique de disponibilité, bouton « Rejoindre » (`steam://connect/ip:port`).
- [ ] (+) Prévenir quand le serveur redevient disponible ou quand une maintenance se termine.
- [ ] (++) Limite de bande passante et pause / reprise manuelle des téléchargements.
- [ ] (+) Lancer le jeu directement connecté au serveur (argument de connexion déclaré dans `launchArgs`).

### Pour les admins
- [ ] (++) Onglet « Publier » : assistant qui calcule le hash, met à jour `latest.beta.yml`, incrémente la version et vérifie les liens avant publication.
- [ ] (+) Comparaison de deux `latest.yml` (beta vs stable) : entrées ajoutées, retirées, versions différentes.
- [ ] (++) Tableau de bord des erreurs d'installation remontées volontairement par les joueurs (rapport Debug envoyé en un clic, sans données personnelles).
- [ ] (+) Planification d'une maintenance : message affiché à l'avance et blocage du lancement pendant la fenêtre.
- [ ] (+) Vérification automatique des liens du `latest.yml` (HTTP 200, taille, hash) en CI, avec alerte si un lien Thunderstore / Nexus disparaît.

### Écosystème
- [ ] (++) Import d'un modpack Thunderstore complet (profil `r2modman`) comme entrée du `latest.yml`.
- [ ] (++) Support de Linux / macOS dans le test de démarrage et les installeurs (AppImage, dmg), avec les chemins par plateforme déjà prévus dans les configs.
- [ ] (+++) Mode « serveur dédié » : installer et mettre à jour le serveur de jeu avec le même moteur (instances de type serveur, sans interface de jeu).
- [ ] (++) API publique en lecture seule du backend (liste des jeux, versions, événements) pour un site web ou un bot Discord.

### Poids de l'installeur (le plus gros gain restant)
- [ ] (++) Modèle 3D `SevenDtoD-3d.glb` : **97 Mo** (Valheim : 4 Mo). Compresser avec `gltf-transform` (meshopt + textures WebP/KTX2) ; objectif < 10 Mo.
- [ ] (++) Bandes-annonces `*-trailer.mp4` : **~92 Mo chacune** (1080p, 7,5 Mb/s). Ré-encoder en 720p, CRF 28 (~10-15 Mo) ou héberger sur le serveur et les charger à la demande ; `pre-loading.mp4` (8 Mo) aussi.
- [ ] (+) Audios `*-song.mp3` (2 Mo et 1,4 Mo) : passer en 96 kbit/s ou hors installeur.
