# backend : serveur de fichiers de dev

Serveur Express qui sert `public/` tel quel (le même dossier est déployé sur le serveur de production, voir le README racine).

```
src/server.ts          démarrage (port 3000)
src/app.ts             application Express (static + 404)
src/lib/request-log.ts journal des requêtes (activé via DEBUG dans app.ts)
public/                voir public/README.md
```

`yarn dev:back` (depuis la racine) lance le serveur sur http://localhost:3000.
