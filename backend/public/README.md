# backend/public : fichiers servis tels quels

```
public/
  games/
    <id>-v2/                      système d'instances (launcher actuel)
      index.config.json           activation, canaux (liens des latest), événement, maintenance, mods, contributeurs
      latest.yml, latest.beta.yml versions et sources de chaque entrée
      config/                     event.json, maintenance.json, contributors.json, mods.json
      hash/                       manifestes de hash (stable.json, beta.json)
    Valheim/, SevenDtoD/          ANCIEN système, gardé pour les anciens launchers (ne pas supprimer)
  configs/                        ANCIEN système (événement / maintenance par jeu), idem
```

Le format est décrit dans `doc/instance-system/README.md`.
