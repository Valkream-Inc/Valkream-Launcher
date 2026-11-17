# Système d'instances (en cours)

Une **instance** = un jeu (ou une variante d'un jeu) décrit par trois couches reliées par un `id` unique (ex : `Valheim-Valkream-v2`).

| Couche | Fichier | Contient |
| --- | --- | --- |
| Main | `frontend/main/src/instances/instances.config.ts` | serveur de jeu, lien de l'index, `allowedPaths` (liste blanche des chemins d'installation) |
| Render | `frontend/renderer/src/instances/instances.config.tsx` | nom, textes, liens, réglages, tableaux Debug |
| Remote | `backend/public/index.config.json` + `games/<id>/latest.yml` | activation par plateforme, versions, sources, hash, mods, contributeurs |

`draft-original/` garde le brouillon de départ, commenté (spécification des champs de `latest.yml`).

## État

- Fait : types partagés (`shared/types/instance.d.ts`), règle de lien, validation de l'index et du `latest.yml`, résolveur avec cache disque, registre d'instances, canal IPC `instances:list` (`window.electron_API.getInstances()`), confinement des chemins.
- Pas encore branché : l'installation, la mise à jour et le lancement passent toujours par les managers `Valheim` et `SevenDtoD`. Aucune interface n'utilise encore `getInstances()`.

## Règles de lien

Une chaîne d'un paramètre remote est : `https://…` (URL), `/chemin` (relatif au serveur de fichiers), `data:…` (donnée, ex : image). Tout autre type de valeur est une donnée inline. `http://` n'est accepté qu'en développement.

## Tests

```
yarn test              # node:test via tsx
yarn typecheck:tests   # types du code et des tests
```

Le test `validate.test.ts` vérifie aussi que les fichiers d'exemple de `backend/public` restent valides.
