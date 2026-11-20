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
- [ ] (++) mettre http2 en place (got plutot que axios)
- [x] (fait) hash à l'installation, reprise par entrée, vérification via hash, cache `instance.hashes.json`
- [x] (fait) doc : README racine, frontend, backend, doc/instance-system

## Propositions d'amélioration

Légende : (+) petit · (++) moyen · (+++) gros. Classées par thème.

### Moteur d'installation
- [ ] (++) Provider Nexus (`nexus_url`) : aujourd'hui une entrée Nexus est un échec explicite.
- [ ] (++) Dépendances Thunderstore transitives (résoudre et installer les dépendances d'un mod).
- [ ] (++) Script `build-manifest --zip` : générer aussi l'archive `zip` d'une entrée `hash_url`.
- [ ] (++) Téléchargements parallèles (limités à 3-4) pour le provider `hash_url` + reprise d'un téléchargement interrompu (HTTP Range).
- [ ] (++) Installation atomique : extraire dans un dossier temporaire puis basculer, pour ne jamais laisser un jeu à moitié mis à jour.
- [ ] (+) Annulation propre d'une installation en cours depuis l'interface (le `signal` existe déjà côté moteur).
- [ ] (+) Vérifier l'espace disque disponible avant une installation.
- [ ] (+++) Mise à jour différentielle des gros fichiers (bsdiff / zstd) pour les mises à jour de jeu.

### Backend / publication
- [ ] (++) Script de publication : copie des fichiers, calcul des hash, mise à jour du `latest.yml` et de la version `X0.X1.X2` en une commande.
- [ ] (++) Test CI qui valide `backend/public` (déjà couvert par `backend-files.test.ts` : l'exécuter dans le workflow GitHub à chaque push).
- [ ] (+) Signature des manifestes (ou des `latest.yml`) pour ne pas dépendre uniquement de HTTPS.
- [ ] (+) Versionner les anciens `latest.yml` pour pouvoir revenir en arrière (rollback d'une version).
- [ ] (++) Dockerfile du backend + en-têtes de cache (ETag, `Cache-Control`) adaptés aux gros fichiers.

### Launcher / UX
- [ ] (++) Page Mods plus riche : recherche, filtres par catégorie, version installée vs disponible.
- [ ] (++) Onglet Debug : export du rapport (JSON) pour le support, bouton « copier les erreurs ».
- [ ] (+) Journal d'installation consultable (fichier de log par instance et par canal).
- [ ] (+) Gestion de plusieurs instances du même jeu côté interface (choix, duplication, suppression avec taille occupée).
- [ ] (++) Accessibilité : navigation clavier, contraste des thèmes, réduction des animations (`prefers-reduced-motion`).
- [ ] (+) Internationalisation (fr/en) : textes aujourd'hui en dur dans la config render et les composants.
- [ ] (++) Mode hors ligne explicite : bandeau « dernière version connue » quand seul le cache disque répond.

### Code et qualité
- [ ] (++) Migration des CSS des thèmes vers MUI, thème par thème (modern → old → futuristic) avec contrôle visuel.
- [ ] (++) Tests du renderer (contexts, `InstanceSettings`, `InstanceButton`) avec Testing Library ; aujourd'hui seuls le main et le moteur sont testés.
- [ ] (+) Lint et `typecheck` dans le workflow CI avant le build des installeurs.
- [ ] (+) Découper `launcher-ipc` / `instance-ipc` par domaine et typer les canaux IPC de bout en bout (un seul fichier de contrat dans `shared/types/ipc.d.ts`).
- [ ] (+) Remplacer `axios` + `progress-stream` + `stream-throttle` par un seul client (`got` / `fetch`), cf. item http2.
- [ ] (+) Renommer `windows/launcher/component` en `components` (cohérence) et ranger les CSS à côté de leur composant.
- [ ] (++) Tests de bout en bout du launcher (Playwright + Electron) sur le backend de dev : installation complète, mise à jour, réparation.

### Sécurité
- [ ] (+) Fenêtres Electron : vérifier `contextIsolation`, `sandbox`, CSP stricte, et limiter `openLink` aux domaines connus.
- [ ] (+) Limiter la taille et la profondeur des archives extraites (protection contre les zip-bombs) en plus du confinement des chemins.
- [ ] (+) `yarn audit` / Dependabot sur les dépendances du launcher.
