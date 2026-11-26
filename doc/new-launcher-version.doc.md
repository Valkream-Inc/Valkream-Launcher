# 📦 Publier une version du launcher

Ce guide explique comment une version du launcher est construite par GitHub Actions, comment elle atteint les joueurs (mise à jour automatique) et comment la déployer sur le serveur.

## 🧭 Sommaire

1. [Vue d'ensemble](#vue-densemble)
2. [Les workflows GitHub](#les-workflows-github)
3. [Publier une version, pas à pas](#publier-une-version-pas-à-pas)
4. [Déployer sur le serveur](#déployer-sur-le-serveur)
5. [Comment le launcher se met à jour](#comment-le-launcher-se-met-à-jour)
6. [Tester un build en local](#tester-un-build-en-local)
7. [Dépannage](#dépannage)

## Vue d'ensemble

```
push sur une branche ──► CI : tests, types, lint
push sur main ─────────► Launcher Build : tests, types, yarn build ──► release GitHub (zips)
                                                                          │ (téléchargement par l'admin)
                                                                          ▼
serveur de fichiers  /launcher/latest/  ◄── dézipper combined-install-win.zip et combined-update-win.zip
        ▲
        └── lu par electron-updater au démarrage de chaque launcher installé
```

## Les workflows GitHub

### CI (`.github/workflows/ci.yml`)

Déclenchée à chaque push hors `main` et sur chaque pull request. Les runs d'une même branche s'annulent entre eux.

| Étape | Rôle |
| --- | --- |
| `yarn install --immutable` | dépendances exactes du `yarn.lock` (Yarn 4 fourni par corepack) |
| `yarn workspace Valkream-Launcher test` | tests du moteur, de la config main, du renderer et des fichiers de `backend/public` |
| `yarn typecheck` | types du main, du renderer, des scripts et du backend |
| `yarn lint` | ESLint (**non bloquant** pour l'instant : dette existante) |

### Launcher Build (`.github/workflows/build.yml`)

Déclenchée à chaque push sur `main` qui modifie `frontend/**` ou `.github/workflows/**`. Un seul build à la fois (`concurrency`, sans annulation).

1. **create-release** : lit la `version` de `frontend/package.json`, avertit si elle n'est pas SemVer, puis crée la release GitHub (pré-release si la version contient `beta` ou `alpha`). **Si la release existe déjà, tout le reste est ignoré** (message « Release existante »).
2. **build-launcher** (Windows) : Node 22, corepack **activé après** `setup-node` (sinon le yarn 1 global est utilisé et le champ `packageManager` fait échouer l'installation), cache Yarn, tests, typecheck, puis `yarn build` dans `frontend/`.
3. **download-global** : récupère les fichiers publiés sur la release, fabrique les archives et les envoie (`gh release upload --clobber`) :
   - `combined-install-win.zip` : installeur complet (`*-install-win*`) ;
   - `combined-update-win.zip` : installeur de mise à jour (`*-update-win*`) + `latest.yml`, le fichier lu par electron-updater.

Linux et macOS sont désactivés pour le moment (le workflow garde les lignes à réactiver).

### Ce que fait `yarn build` (dans `frontend/`)

| Étape | Rôle |
| --- | --- |
| `set-icon` | icône de l'application |
| `build:compile` | Vite (renderer) + `tsc` (main) |
| `build:electron` | `build-script.ts` : obfuscation, puis deux builds NSIS **install** et **update** (celui-ci avec paquet différentiel et blockmap). **Un build en échec fait échouer la commande.** |
| `check:build` | `dist/latest.yml` décrit exactement les fichiers produits (version, taille, sha512, blockmap) et l'application embarquée contient ce que la fenêtre de mise à jour charge ; `--previous <version>` exige une version strictement supérieure |
| `check:runtime` | démarre le build et vérifie qu'il s'exécute |

## Publier une version, pas à pas

1. Choisir la nouvelle version et la mettre dans `frontend/package.json` (`version`). **Elle doit être nouvelle** : le tag de la release en est déduit.
   - Format recommandé : SemVer, `3.1.0` ou `3.1.0-beta.1`. Le format historique `beta-3.0.0` n'est pas du SemVer : electron-updater compare les versions avec SemVer, un format invalide peut empêcher la mise à jour.
   - Une version **majeure** différente de l'installée nettoie les installations au premier démarrage (réglages conservés) ; mineures et correctifs ne suppriment rien.
2. Vérifier en local : `yarn workspace Valkream-Launcher test` et `yarn typecheck`.
3. Fusionner sur `main` (pull request, la CI doit être verte).
4. Suivre le workflow **Launcher Build** (onglet Actions) jusqu'à la fin.
5. Télécharger `combined-install-win.zip` et `combined-update-win.zip` depuis la [page des releases](https://github.com/Valkream-Inc/Valkream-Launcher/releases).
6. Les déployer (section suivante), puis installer sur une machine de test et lancer le launcher.

## Déployer sur le serveur

Structure attendue :

```
/launcher
├── latest/            version actuelle (contenu des deux zips dézippés, dont latest.yml)
└── old/
    └── 3.0.0/         anciennes versions archivées
```

1. Se connecter au serveur (SSH / SFTP) et aller dans `/launcher`.
2. Lire la version actuelle (`cat latest/latest.yml`) et archiver : `mv latest old/<version> && mkdir latest`.
3. Envoyer les deux zips, puis les extraire dans `latest/` (`unzip combined-install-win.zip -d latest/`, idem pour l'autre). **Les zips contiennent directement les fichiers** (pas de dossier parent).
4. Vérifier que `latest/latest.yml` est présent et que les fichiers qu'il cite existent.

> Ne jamais écraser `latest/` sans archiver la version précédente. Mettre `latest.yml` en dernier évite qu'un joueur lise une version dont les fichiers ne sont pas encore tous envoyés.

## Comment le launcher se met à jour

Au démarrage, la fenêtre de mise à jour (`main/src/ipc/check-for-updates.ts`) :

1. vérifie que le serveur est joignable (sinon : erreur traduite) ;
2. interroge `<baseUrl>/launcher/latest/latest.yml` avec electron-updater (fournisseur `generic`), avec un **délai maximal de 30 s** ;
3. télécharge la mise à jour (progression envoyée au plus **4 fois par seconde**), puis redémarre pour l'installer ;
4. lance le launcher si aucune mise à jour n'est disponible.

Les jeux et les réglages ne sont jamais supprimés par une mise à jour (sauf nettoyage d'une version majeure). Le mode beta ne désactive pas la mise à jour.

**Contourner la mise à jour** (tests) : Ctrl + Maj + clic sur la vidéo de la fenêtre de mise à jour.

## Tester un build en local

```bash
cd frontend
yarn build            # compile, construit les installeurs dans dist/, lance check:build et check:runtime
```

Sans publier, `GITHUB_TOKEN` n'est pas nécessaire. Les installeurs sont dans `frontend/dist/`.

## Dépannage

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| « This project's package.json defines "packageManager": "yarn@4…" ; the current global version of Yarn is 1.22 » | corepack activé avant `setup-node`, ou cache Yarn de `setup-node` | l'ordre du workflow actuel (`setup-node` → `corepack enable` → cache) l'évite ; ne pas remettre `cache: yarn` dans `setup-node` |
| Le workflow se termine mais rien n'est construit, notice « Release existante » | la version de `package.json` est déjà publiée | incrémenter la version |
| CI rouge sur un test de réglages / de config | un test ne suit pas un changement de comportement | lancer `yarn workspace Valkream-Launcher test` en local avant de pousser |
| Les joueurs ne reçoivent pas la mise à jour | `latest/latest.yml` absent, ancien ou version non SemVer / non supérieure | vérifier le fichier sur le serveur, `yarn check:build --previous <version installée>` |
| Avertissement SmartScreen à l'installation | installeur non signé | signature de code Windows (voir TODO) |
