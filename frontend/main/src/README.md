# Arborescence du main

| Dossier | Contenu |
| --- | --- |
| `core/` | Constantes, dossiers (`dirs`), réglages, infos serveur, version du launcher |
| `windows/` | Fenêtres Electron et preloads (chemins relatifs au build : ne pas déplacer) |
| `ipc/` | Handlers IPC (launcher, instances, outils admin) et registre des synchronisations |
| `instances/remote/` | Index distant : registre, validation, paramètres ; `fetch/` = HTTP + cache disque |
| `instances/local/` | État d'une instance sur disque ; `steam/` = bibliothèque Steam ; `launch/` = commande et arguments de lancement |
| `instances/install/` | `InstanceInstaller` + `game-source` ; `providers/` = zip, hash, Thunderstore, Nexus… |
| `instances/install/depot/` | DepotDownloader (config, épinglage, téléchargement, exécution) |
| `instances/install/files/` | Opérations fichiers : copie, staging, extraction, préservation, hash |
| `instances/install/state/` | Manifeste, journal et store d'installation, progression |
| `instances/tools/` | Outils admin : hash de dossier, liste des mods |
| `lib/net/` | HTTP, téléchargements (reprise), limiteur de débit, liens sûrs |
| `lib/archive/` | Extraction tar, limites d'archives |
| `lib/fs/` | Chemins, dossier des jeux (déplacement), désinstallation |
| `lib/settings/` | Stockage des réglages, anciens réglages, version du launcher |
| `lib/errors/` | `LocalizedError` et dictionnaire fr/en |
| `lib/format/` | Formats et parsers purs (octets, versions, VDF, motifs, clés JSON) |

Un test (`*.test.ts`) reste à côté du fichier qu'il teste. `yarn check:runtime` vérifie, après `yarn build`,
que le main obfusqué est exécutable (syntaxe, imports dans Node, comportement, démarrage Electron).
