# frontend : launcher Electron

```
main/                 process Electron (Node)
  app.ts              point d'entrée
  src/
    core/             services du launcher : constants, dirs, files, settings, launcher, server-infos
    lib/              helpers techniques sans logique métier (database, download-file, paths, patterns, version…)
    windows/          fenêtres (main, update) et preloads
    ipc/              handlers IPC : launcher-ipc, instance-ipc, check-for-updates
    instances/        les jeux : config main, remote/ (index, latest, liens), install/ (providers, hash, cache), local/ (rapport, statut, lancement)
renderer/             interface React + MUI
  src/instances/      config render de chaque jeu (images, fonds, textes, réglages)
  src/windows/        launcher (contexts, composants, panneaux, thèmes) et updater
shared/types/         types partagés main / preload / renderer (.d.ts uniquement)
scripts/              build-manifest (manifeste de hash d'un dossier), dev-main
```

## Commandes (depuis la racine du dépôt)

| Commande | Rôle |
| --- | --- |
| `yarn dev` / `yarn dev:fast` | launcher + backend en développement |
| `yarn test` | tests (`node:test` via `tsx`, à côté du code : `*.test.ts`) |
| `yarn typecheck` | types du main, du renderer, des tests et des scripts |
| `yarn workspace Valkream-Launcher build:manifest <source> <sortie>` | génère le manifeste de hash d'un dossier |
| `yarn build` | installeurs |

## Conventions

- Un seul pont IPC générique (`window.electron_API`) : les jeux sont désignés par leur `id` d'instance, jamais par une API par jeu.
- Types partagés dans `shared/types`, types internes à côté du code (`*.types.ts`).
- Ajouter un jeu : voir `doc/instance-system/README.md`.
