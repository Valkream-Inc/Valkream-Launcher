# Exemples d'instances

Ces fichiers ne sont pas branchés dans le launcher : ils servent de modèle (copier, adapter, publier). Les valeurs
qui ne peuvent pas être devinées (hash, build Steam, manifeste de dépôt) sont marquées « à renseigner ».

- `valheim-alpha-steam/` : canal **alpha** de `Valheim-Valkream-v2`, jeu copié depuis la bibliothèque Steam du joueur
  (`steam_library`, branche bêta Steam, DepotDownloader en option).
- `minecraft-java/` : instance Minecraft avec un **Java (JRE Temurin) installé par le launcher dans `/java`** et utilisé
  pour lancer le jeu (`command: "java/bin/javaw.exe"`), réglage de mémoire en curseur (`-Xmx{ram}M`).
