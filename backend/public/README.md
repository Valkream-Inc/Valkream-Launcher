# backend/public : fichiers servis tels quels

```
public/
  games/
    <id>/                         un dossier par instance (ex : Valheim-Valkream-v2)
      index.config.json           activation, canaux (liens des latest), événement, maintenance, mods, contributeurs
      latest.yml, latest.beta.yml versions et sources de chaque entrée (stable / beta)
      config/                     event.json, maintenance.json, contributors.json, mods.json
      hash/                       manifestes de hash (stable.json, beta.json)
```

Les gros fichiers (zips, dossiers `files/`) sont hébergés sur le serveur sous `/games/<jeu>/latest/`, hors dépôt. Le format est décrit dans `doc/instance-system/README.md`.
