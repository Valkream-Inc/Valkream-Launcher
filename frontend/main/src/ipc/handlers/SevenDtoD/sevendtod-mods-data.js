/**
 * @author Valkream Team
 * @license MIT-NC
 */

const SevenDtoDHashManager = require("../../../manager/SevenDtoD/SevenDtoDHashManager");
const SevenDtoDModsManager = require("../../../manager/SevenDtoD/SevenDtoDModsManager");

const { formatBytes } = require("../../../utils/function/formatBytes");

async function SevenDtoD_ModsDataHandler(event) {
  const callback = (processedBytes, totalBytes, percent, speed) => {
    event.sender.send("progress-mods-data-sevendtod", {
      processedBytes: formatBytes(processedBytes),
      totalBytes: formatBytes(totalBytes),
      percent,
      speed: formatBytes(speed),
    });
  };

  // Récupérer les deux listes de hashs (local et en ligne)
  const [localHash, onlineHash] = await Promise.all([
    SevenDtoDHashManager.getLocalHash(true, callback),
    SevenDtoDHashManager.getOnlineHash(true),
  ]);

  const results = [];

  // Déterminer les actions
  const modifiedFiles = SevenDtoDModsManager.findModifiedFiles(
    localHash,
    onlineHash
  );
  const deletedFiles = SevenDtoDModsManager.findDeletedFiles(
    localHash,
    onlineHash
  );
  const movedFiles = SevenDtoDModsManager.findMovedFiles(localHash, onlineHash);
  const newFilesToDownload = SevenDtoDModsManager.findFilesToDownload(
    localHash,
    onlineHash
  );

  // =================================================================
  // 1. MODIFIED (Même chemin, Hash Local != Hash Online)
  Object.keys(modifiedFiles).forEach((path) => {
    results.push({
      status: "MODIFIED",
      oldPath: path,
      newPath: path,
      hashLocal: localHash[path],
      hashOnline: modifiedFiles[path],
    });
  });

  // =================================================================
  // 2. DELETED (Présent localement, absent en ligne, et non déplacé)
  Object.keys(deletedFiles).forEach((path) => {
    results.push({
      status: "DELETED",
      oldPath: path,
      newPath: null, // Le fichier est supprimé côté cible
      hashLocal: deletedFiles[path],
      hashOnline: null,
    });
  });

  // =================================================================
  // 3. NEW (Absent localement, présent en ligne, et non destination de déplacement)
  Object.keys(newFilesToDownload).forEach((path) => {
    results.push({
      status: "NEW",
      oldPath: null, // N'existe pas localement
      newPath: path,
      hashLocal: null,
      hashOnline: newFilesToDownload[path],
    });
  });

  // =================================================================
  // 4. MOVED (Même Hash, Chemin Ancien != Chemin Nouveau)
  movedFiles.forEach((move) => {
    results.push({
      status: "MOVED",
      oldPath: move.oldPath,
      newPath: move.newPath,
      hashLocal: move.hash, // Le hash est le même pour local et online
      hashOnline: move.hash,
    });
  });

  // =================================================================
  // 5. UNCHANGED (Reste des fichiers non traités)

  // Combiner tous les chemins connus (local et online) et exclure ceux déjà traités
  const allPaths = new Set([
    ...Object.keys(localHash),
    ...Object.keys(onlineHash),
  ]);

  // Chemins déjà couverts par un statut de changement
  const changedPaths = new Set([
    ...Object.keys(modifiedFiles),
    ...Object.keys(deletedFiles),
    ...Object.keys(newFilesToDownload),
    ...movedFiles.map((m) => m.oldPath), // Anciens chemins des déplacés
    ...movedFiles.map((m) => m.newPath), // Nouveaux chemins des déplacés
  ]);

  // Identifier les UNCHANGED
  allPaths.forEach((path) => {
    // Un fichier est UNCHANGED s'il existe dans les deux listes, a le même hash, et n'est pas le chemin d'un fichier MOVED
    if (localHash[path] === onlineHash[path] && !changedPaths.has(path)) {
      results.push({
        status: "UNCHANGED",
        oldPath: path,
        newPath: path,
        hashLocal: localHash[path],
        hashOnline: onlineHash[path],
      });
    }
  });

  return results;
}

module.exports = SevenDtoD_ModsDataHandler;
