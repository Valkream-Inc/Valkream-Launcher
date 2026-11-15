/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs/promises";
import fse from "fs-extra";
import path from "path";
import { shell } from "electron";
import type { ProgressCallback, SevenDtoDHashMap } from "@shared/types";
import type {
  SevenDtoDLooseProgressCallback,
  SevenDtoDModsFixData,
  SevenDtoDMovedFile,
  SevenDtoDTextCallback,
} from "../../types/sevendtod";

import SevenDtoDDirsManager from "./SevenDtoDDirsManager";
import SevenDtoDFilesManger from "./SevenDtoDFilesManager";
import SevenDtoDLinksManager from "./SevenDtoDLinksManager";
import SevenDtoDHashManager from "./SevenDtoDHashManager";

import { dowloadMultiplefiles } from "../../utils";

class SevenDtoDModsManager {
  gameModsDir!: string;

  init(): void {
    this.gameModsDir = SevenDtoDDirsManager.modsPath();
  }

  async uninstall(): Promise<void> {
    this.init();
    try {
      await fse.remove(this.gameModsDir);
      await fse.ensureDir(this.gameModsDir);
    } catch (err) {
      throw new Error(`Échec de la désinstallation : ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async install(
    callback: ProgressCallback = () => {},
    text = "Téléchargement des mods..."
  ) {
    this.init();
    try {
      await this.uninstall();

      const modsFilesBaseUrl = await SevenDtoDLinksManager.modsFileBaseUrl();
      const onlineHash = await SevenDtoDHashManager.getOnlineHash();

      const mods = Object.keys(onlineHash ?? {}).map((modPath) => ({
        url: `${modsFilesBaseUrl}/${modPath}`,
        destPath: path.join(this.gameModsDir, modPath),
      }));

      return await dowloadMultiplefiles(mods, (data) =>
        callback(
          text,
          data.downloadedBytes,
          data.totalBytes,
          data.percent,
          data.speed
        )
      );
    } catch (err) {
      throw new Error(`Échec de l'installation : ${err}`);
    }
  }

  /**
   * 1. Trouve les fichiers qui existent dans les deux versions mais dont le HASH a changé.
   * (Même chemin, Hash différent)
   * @param {Object<string, string>} oldFiles - Inventaire Ancien (chemin: hash)
   * @param {Object<string, string>} newFiles - Inventaire Nouveau (chemin: hash)
   * @returns {Object<string, string>} Dictionnaire des fichiers modifiés (chemin: nouveau_hash)
   */
  findModifiedFiles(
    oldFiles: SevenDtoDHashMap,
    newFiles: SevenDtoDHashMap
  ): SevenDtoDHashMap {
    // 1. Filtrer les chemins qui existent dans les deux listes ET ont un hash différent
    const modifiedPaths = Object.keys(newFiles).filter(
      (path) =>
        Object.hasOwn(oldFiles, path) && oldFiles[path] !== newFiles[path]
    );

    // 2. Réduire le résultat filtré à un objet {chemin: nouveau_hash}
    return modifiedPaths.reduce<SevenDtoDHashMap>((acc, path) => {
      acc[path] = newFiles[path];
      return acc;
    }, {});
  }

  /**
   * 2. Trouve les fichiers qui ont été déplacés ou renommés.
   * (Même Hash, Chemin différent)
   * @param {Object<string, string>} oldFiles - Inventaire Ancien (chemin: hash)
   * @param {Object<string, string>} newFiles - Inventaire Nouveau (chemin: hash)
   * @returns {Array<{oldPath: string, newPath: string}>} Liste des chemins déplacés
   */
  findMovedFiles(
    oldFiles: SevenDtoDHashMap,
    newFiles: SevenDtoDHashMap
  ): SevenDtoDMovedFile[] {
    const movedFiles: SevenDtoDMovedFile[] = [];

    // Helper pour grouper les fichiers par hash (simplifié avec reduce)
    const groupByHash = (fileList: SevenDtoDHashMap) =>
      Object.entries(fileList).reduce<Record<string, string[]>>((acc, [path, hash]) => {
        if (!acc[hash]) acc[hash] = [];
        acc[hash].push(path);
        return acc;
      }, {});

    const oldFilesByHash = groupByHash(oldFiles);
    const newFilesByHash = groupByHash(newFiles);

    // 1. Identifier les hashes présents dans les deux listes (candidats au déplacement)
    const commonHashes = Object.keys(oldFilesByHash).filter((hash) =>
      Object.hasOwn(newFilesByHash, hash)
    );

    // 2. Parcourir les hashes communs pour trouver les déplacements (1:1)
    for (const hash of commonHashes) {
      const oldPaths = oldFilesByHash[hash];
      const newPaths = newFilesByHash[hash];

      // Chemins qui ont disparu (candidats pour 'oldPath')
      const deletedOldPaths = oldPaths.filter(
        (oldPath) => !Object.hasOwn(newFiles, oldPath)
      );

      // Nouveaux chemins qui sont apparus (candidats pour 'newPath')
      const addedNewPaths = newPaths.filter(
        (newPath) => !Object.hasOwn(oldFiles, newPath)
      );

      // On ne peut déplacer qu'autant de fichiers qu'il y en a de disparus/apparus
      const movesCount = Math.min(deletedOldPaths.length, addedNewPaths.length);

      for (let i = 0; i < movesCount; i++) {
        movedFiles.push({
          oldPath: deletedOldPaths[i],
          newPath: addedNewPaths[i],
          hash: hash,
        });
      }
    }

    return movedFiles;
  }

  /**
   * 3. Trouve les fichiers à supprimer.
   * (Chemin dans l'ancienne liste mais pas dans la nouvelle, et non déplacé)
   * @param {Object<string, string>} oldFiles - Inventaire Ancien (chemin: hash)
   * @param {Object<string, string>} newFiles - Inventaire Nouveau (chemin: hash)
   * @returns {Object<string, string>} Dictionnaire des fichiers à supprimer (chemin: hash)
   */
  findDeletedFiles(
    oldFiles: SevenDtoDHashMap,
    newFiles: SevenDtoDHashMap
  ): SevenDtoDHashMap {
    // Calculer les chemins des fichiers considérés comme déplacés dans l'ancienne liste
    const movedFiles = this.findMovedFiles(oldFiles, newFiles);
    const movedOldPaths = new Set(movedFiles.map((m) => m.oldPath));

    // 1. Filtrer les anciens chemins qui ne sont pas dans la nouvelle liste ET qui ne sont pas déplacés
    const deletedPaths = Object.keys(oldFiles).filter(
      (path) => !Object.hasOwn(newFiles, path) && !movedOldPaths.has(path)
    );

    // 2. Réduire le résultat filtré à un objet {chemin: hash}
    return deletedPaths.reduce<SevenDtoDHashMap>((acc, path) => {
      acc[path] = oldFiles[path];
      return acc;
    }, {});
  }

  /**
   * 4. Trouve les fichiers à télécharger (nouveaux fichiers).
   * (Chemin dans la nouvelle liste mais pas dans l'ancienne, et non déplacé)
   * @param {Object<string, string>} oldFiles - Inventaire Ancien (chemin: hash)
   * @param {Object<string, string>} newFiles - Inventaire Nouveau (chemin: hash)
   * @returns {Object<string, string>} Dictionnaire des nouveaux fichiers (chemin: hash)
   */
  findFilesToDownload(
    oldFiles: SevenDtoDHashMap,
    newFiles: SevenDtoDHashMap
  ): SevenDtoDHashMap {
    // Calculer les chemins des fichiers considérés comme déplacés dans la nouvelle liste
    const movedFiles = this.findMovedFiles(oldFiles, newFiles);
    const movedNewPaths = new Set(movedFiles.map((m) => m.newPath));

    // 1. Filtrer les nouveaux chemins qui ne sont pas dans l'ancienne liste ET qui ne sont pas des destinations de déplacement
    const newPathsToDownload = Object.keys(newFiles).filter(
      (path) => !Object.hasOwn(oldFiles, path) && !movedNewPaths.has(path)
    );

    // 2. Réduire le résultat filtré à un objet {chemin: hash}
    return newPathsToDownload.reduce<SevenDtoDHashMap>((acc, path) => {
      acc[path] = newFiles[path];
      return acc;
    }, {});
  }

  /**
   * Met à jour les mods en effectuant les opérations suivantes :
   * 1. Suppression des fichiers obsolètes (supprimés ou anciennes versions des modifiés).
   * 2. Déplacement/Renommage des fichiers déplacés.
   * 3. Téléchargement des nouveaux fichiers et des versions mises à jour des modifiés.
   * * @param {Function} callback Fonction de rappel pour la progression du téléchargement.
   * @param {string} text Texte affiché pendant le téléchargement.
   */
  async update(
    callback: SevenDtoDLooseProgressCallback = () => {},
    text = "Mise à jour des mods..."
  ): Promise<void> {
    this.init();
    try {
      const oldFiles = await SevenDtoDHashManager.getLocalHash();
      const newFiles = await SevenDtoDHashManager.getOnlineHash();

      // 1. Détermination des actions de synchronisation
      const modifiedFiles = this.findModifiedFiles(oldFiles, newFiles);
      const deletedFiles = this.findDeletedFiles(oldFiles, newFiles);
      const movedFiles = this.findMovedFiles(oldFiles, newFiles);
      const newFilesToDownload = this.findFilesToDownload(oldFiles, newFiles);

      // Fichiers à supprimer : Les fichiers vraiment supprimés + les anciennes versions des fichiers modifiés
      const filesToDelete = new Set([
        ...Object.keys(deletedFiles),
        ...Object.keys(modifiedFiles),
      ]);

      // Fichiers à télécharger : Les nouveaux fichiers + les nouvelles versions des fichiers modifiés
      const filesToDownloadMap = { ...newFilesToDownload, ...modifiedFiles };
      const modsFilesBaseUrl = await SevenDtoDLinksManager.modsFileBaseUrl();
      const downloads = Object.keys(filesToDownloadMap).map((filePath) => ({
        url: `${modsFilesBaseUrl}/${filePath}`,
        destPath: path.join(this.gameModsDir, filePath),
      }));

      // 2. Opérations de suppression (Supprimés + Anciens Modifiés)
      if (filesToDelete.size > 0) {
        callback(`Suppression de ${filesToDelete.size} fichiers obsolètes...`);
        const deletePromises = Array.from(filesToDelete).map((filePath) =>
          fse.remove(path.join(this.gameModsDir, filePath))
        );
        await Promise.all(deletePromises);
      }

      // 3. Opérations de déplacement (Renommés/Déplacés)
      if (movedFiles.length > 0) {
        callback(`Déplacement de ${movedFiles.length} fichiers renommés...`);
        const movePromises = movedFiles.map(({ oldPath, newPath }) =>
          fse.move(
            path.join(this.gameModsDir, oldPath),
            path.join(this.gameModsDir, newPath),
            { overwrite: true }
          )
        );
        await Promise.all(movePromises);
      }

      // 4. Opérations de téléchargement (Nouveaux + Modifiés)
      if (downloads.length > 0) {
        callback(text);
        await dowloadMultiplefiles(downloads, (data) =>
          callback(
            text,
            data.downloadedBytes,
            data.totalBytes,
            data.percent,
            data.speed
          )
        );
      } else {
        callback("Mise à jour terminée. Rien à télécharger.", 0, 0, 100, 0);
      }
    } catch (err) {
      throw new Error(`Échec de la mise à jour des mods : ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async generateFix(
    callback: SevenDtoDTextCallback = () => {},
    text = "Création d'un fix pour les mods ..."
  ): Promise<string> {
    this.init();
    try {
      // 1. Récupération des états
      const localFiles = await SevenDtoDHashManager.getLocalHash();
      const onlineFiles = await SevenDtoDHashManager.getOnlineHash();

      // 2. Identification des mouvements et changements
      const modifiedFiles = this.findModifiedFiles(onlineFiles, localFiles);
      const newFilesToUpload = this.findFilesToDownload(
        onlineFiles,
        localFiles
      );
      const deletedFilesOnServer = this.findDeletedFiles(
        onlineFiles,
        localFiles
      );
      const movedFiles = this.findMovedFiles(onlineFiles, localFiles);

      // A. Fichiers à COPIER dans le dossier fix (pour être uploadés/écrasés) :
      const filesToCopyPaths = new Set([
        ...Object.keys(newFilesToUpload),
        ...Object.keys(modifiedFiles),
        ...movedFiles.map((m) => m.newPath),
      ]);

      // B. Fichiers à SUPPRIMER sur le serveur :
      const filesToDeleteOnServer = new Set([
        ...Object.keys(deletedFilesOnServer),
        ...movedFiles.map((m) => m.oldPath),
      ]);

      // 3. Préparation du dossier de sortie
      const fixOutputDir = SevenDtoDDirsManager.modsFixFilesPath();
      if (fse.existsSync(fixOutputDir)) {
        await fse.emptyDir(fixOutputDir);
      } else {
        await fse.ensureDir(fixOutputDir);
      }

      // 4. Copie physique des fichiers vers le dossier fix
      if (filesToCopyPaths.size > 0) {
        callback(
          `Préparation de ${filesToCopyPaths.size} fichiers (nouveaux, modifiés ou déplacés)...`
        );
        for (const filePath of filesToCopyPaths) {
          const source = path.join(this.gameModsDir, filePath);
          const destination = path.join(fixOutputDir, filePath);

          // On s'assure que le sous-dossier existe dans le fix avant de copier
          await fse.ensureDir(path.dirname(destination));
          await fse.copy(source, destination);
        }
      }

      // 5. Création du fichier mods-hash.fix
      const deleteList = Array.from(filesToDeleteOnServer);
      const fixData: SevenDtoDModsFixData = {
        generatedAt: new Date().toISOString(),
        stats: {
          toUpload: filesToCopyPaths.size,
          toDelete: deleteList.length,
          moved: movedFiles.length,
        },
        delete: deleteList,
      };

      await fse.writeJson(SevenDtoDFilesManger.modsToDeleteFixPath(), fixData, {
        spaces: 2,
      });

      callback(
        `Fix généré ! ${filesToCopyPaths.size} fichiers à uploader, ${deleteList.length} à supprimer du serveur.`
      );

      const modFixFolder = SevenDtoDDirsManager.modsFixPath();
      await fs.access(modFixFolder);
      return shell.openPath(modFixFolder);
    } catch (err) {
      throw new Error(`Échec de la génération du fix : ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

export default new SevenDtoDModsManager();
