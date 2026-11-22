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
import { BrowserWindow, dialog, ipcMain } from "electron";

import type { ModsListResult, ToolsHashSummary } from "@shared/types";

import { exportHashFolder, hashFolder } from "../instances/tools/hash-folder.js";
import { buildModsDisplay, parseModList } from "../instances/tools/mods-list.js";
import { httpGetText } from "../lib/http.js";

const window = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

const patterns = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];

export default function registerAdminToolsIpc(): void {
  let lastFolder: string | null = null;

  ipcMain.handle("tools:hash-folder", async (_event, ignore: unknown): Promise<ToolsHashSummary | null> => {
    const picked = await dialog.showOpenDialog(window(), { properties: ["openDirectory"], title: "Dossier à hasher" });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const folder = picked.filePaths[0];
    lastFolder = folder;
    return { folder, ...(await hashFolder(folder, patterns(ignore))) };
  });

  // Écrit hash.json + hash/ pour le dossier choisi précédemment
  ipcMain.handle("tools:export-hash", async (_event, ignore: unknown): Promise<{ output: string } | null> => {
    const source = lastFolder;
    if (!source) throw new Error("Choisissez d'abord un dossier à hasher");
    const picked = await dialog.showOpenDialog(window(), {
      properties: ["openDirectory", "createDirectory"],
      title: "Dossier de sortie (hash.json + hash/)",
    });
    if (picked.canceled || !picked.filePaths[0]) return null;
    const output = picked.filePaths[0];
    if (path.resolve(output) === path.resolve(source)) throw new Error("La sortie doit être différente du dossier source");
    await exportHashFolder(source, output, patterns(ignore));
    return { output };
  });

  ipcMain.handle("tools:mods-list", async (_event, source: unknown, apiUrl?: unknown): Promise<ModsListResult> => {
    let text = String(source ?? "").trim();
    // Un lien vers la liste (JSON ou texte) est aussi accepté
    if (/^https?:\/\/\S+$/.test(text)) text = await httpGetText(text, { timeout: 10_000 });
    const api = typeof apiUrl === "string" && /^https?:\/\//.test(apiUrl) ? apiUrl : undefined;
    return buildModsDisplay(
      parseModList(text),
      async (url) => JSON.parse(await httpGetText(url, { timeout: 10_000 })),
      api,
    );
  });

  ipcMain.handle("tools:save-text", async (_event, defaultName: unknown, text: unknown): Promise<string | null> => {
    const picked = await dialog.showSaveDialog(window(), { defaultPath: path.basename(String(defaultName ?? "export.json")) });
    if (picked.canceled || !picked.filePath) return null;
    fs.writeFileSync(picked.filePath, String(text ?? ""));
    return picked.filePath;
  });
}
