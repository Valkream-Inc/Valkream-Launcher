/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * IPC des outils admin (onglet Tools) : hash d'un dossier, export prêt pour le backend,
 * liste de mods depuis un manifest Thunderstore, enregistrement de fichiers texte.
 * Les dossiers passent toujours par une boîte de dialogue : le renderer n'envoie jamais de chemin.
 */

import fs from "fs";
import path from "path";
import { BrowserWindow, dialog, ipcMain, type WebContents } from "electron";

import type { ModsListResult, ToolsHashSummary } from "@shared/types";

import { exportHashFolder, hashFolder } from "../instances/tools/hash-folder.js";
import { buildModsDisplay, parseModList, parsePackagePage, refsFromPackagePage } from "../instances/tools/mods-list.js";
import { httpGetText } from "../lib/http.js";
import { LocalizedError } from "../lib/localized-error.js";

const window = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

/** Progression d'un outil, affichée par une barre dans l'onglet Tools. */
const reporter = (sender: WebContents, tool: "hash" | "mods") => (done: number, total: number) => {
  if (!sender.isDestroyed()) sender.send("tools:progress", { tool, done, total });
};

/** Taille maximale d'un fichier de liste ouvert depuis l'outil (évite de charger un gros fichier par erreur). */
const MAX_TEXT_FILE_BYTES = 1024 * 1024;

const patterns = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];

export default function registerAdminToolsIpc(): void {
  let lastFolder: string | null = null;

  ipcMain.handle("tools:hash-folder", async (event, ignore: unknown): Promise<ToolsHashSummary | null> => {
    const picked = await dialog.showOpenDialog(window(), { properties: ["openDirectory"], title: "Dossier à hasher" });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const folder = picked.filePaths[0];
    lastFolder = folder;
    return { folder, ...(await hashFolder(folder, patterns(ignore), reporter(event.sender, "hash"))) };
  });

  // Écrit hash.json + hash/ pour le dossier choisi précédemment
  ipcMain.handle("tools:export-hash", async (event, ignore: unknown): Promise<{ output: string } | null> => {
    const source = lastFolder;
    if (!source) throw new LocalizedError("err.pickFolder");
    const picked = await dialog.showOpenDialog(window(), {
      properties: ["openDirectory", "createDirectory"],
      title: "Dossier de sortie (hash.json + hash/)",
    });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const output = picked.filePaths[0];
    if (path.resolve(output) === path.resolve(source)) throw new LocalizedError("err.sameOutput");
    await exportHashFolder(source, output, patterns(ignore), reporter(event.sender, "hash"));
    return { output };
  });

  ipcMain.handle("tools:mods-list", async (event, source: unknown, apiUrl?: unknown, key?: unknown, withDependencies?: unknown): Promise<ModsListResult> => {
    let text = String(source ?? "").trim();
    const api = typeof apiUrl === "string" && /^https?:\/\//.test(apiUrl) ? apiUrl : undefined;
    const fetchJson = async (url: string) => JSON.parse(await httpGetText(url, { timeout: 10_000 })) as unknown;
    // Page d'un mod Thunderstore : le mod (et ses dépendances) sont lus via l'API, hôte reconnu (Thunderstore, Hexium)
    const page = parsePackagePage(text);
    if (page) {
      return buildModsDisplay(await refsFromPackagePage(page, fetchJson, undefined, withDependencies !== false), fetchJson, page.origin, reporter(event.sender, "mods"));
    }
    // Un lien vers la liste (JSON ou texte) est aussi accepté
    if (/^https?:\/\/\S+$/.test(text)) text = await httpGetText(text, { timeout: 10_000 });
    return buildModsDisplay(
      parseModList(text, typeof key === "string" ? key : undefined),
      fetchJson,
      api,
      reporter(event.sender, "mods"),
    );
  });

  // Fichier de liste (texte ou JSON) choisi par boîte de dialogue : le renderer ne fournit jamais de chemin
  ipcMain.handle("tools:open-text-file", async (): Promise<{ name: string; text: string } | null> => {
    const picked = await dialog.showOpenDialog(window(), {
      properties: ["openFile"],
      filters: [{ name: "Liste", extensions: ["txt", "json", "md"] }],
    });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const file = picked.filePaths[0];
    if (fs.statSync(file).size > MAX_TEXT_FILE_BYTES) throw new LocalizedError("err.fileTooLarge", { max: "1 Mo" });
    return { name: path.basename(file), text: fs.readFileSync(file, "utf8") };
  });

  ipcMain.handle("tools:save-text", async (_event, defaultName: unknown, text: unknown): Promise<string | null> => {
    const picked = await dialog.showSaveDialog(window(), { defaultPath: path.basename(String(defaultName ?? "export.json")) });
    if (picked.canceled || !picked.filePath) return null;
    fs.writeFileSync(picked.filePath, String(text ?? ""));
    return picked.filePath;
  });
}
