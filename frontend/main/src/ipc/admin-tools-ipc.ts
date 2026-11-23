/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * IPC des outils admin (onglet Tools) : hash d'un dossier, export prêt pour le backend,
 * liste de mods depuis un manifest Thunderstore, enregistrement de fichiers texte.
 * Les dossiers passent toujours par une boîte de dialogue : le renderer n'envoie jamais de chemin.
 */

import { BrowserWindow, dialog, ipcMain, type WebContents } from "electron";
import fs from "fs";
import path from "path";

import type { ModsApi, ModsListResult, ToolsHashSummary } from "@shared/types";

import SettingsManager from "../core/settings.js";
import { nexusGetJson } from "../instances/install/providers/nexus.js";
import {
  exportHashFolder,
  hashFolder,
} from "../instances/tools/hash-folder.js";
import {
  buildModsDisplay,
  buildNexusDisplay,
  nexusItemFromPage,
  parseModList,
  parseNexusList,
  parseNexusPage,
  parsePackagePage,
  refsFromPackagePage,
} from "../instances/tools/mods-list.js";
import { httpGetText } from "../lib/http.js";
import { LocalizedError } from "../lib/localized-error.js";

const window = () =>
  BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

/** Progression d'un outil, affichée par une barre dans l'onglet Tools. */
const reporter = (sender: WebContents, tool: "hash" | "mods") => {
  let last = 0;
  return (done: number, total: number) => {
    // Au plus un événement toutes les 100 ms (le dernier passe toujours) : le renderer ne suit pas des milliers de fichiers
    const now = Date.now();
    if (done < total && now - last < 100) return;
    last = now;
    if (!sender.isDestroyed())
      sender.send("tools:progress", { tool, done, total });
  };
};

/** Taille maximale d'un fichier de liste ouvert depuis l'outil (évite de charger un gros fichier par erreur). */
const MAX_TEXT_FILE_BYTES = 1024 * 1024;

const patterns = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map(String)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

export default function registerAdminToolsIpc(): void {
  let lastFolder: string | null = null;

  ipcMain.handle(
    "tools:hash-folder",
    async (event, ignore: unknown): Promise<ToolsHashSummary | null> => {
      const picked = await dialog.showOpenDialog(window(), {
        properties: ["openDirectory"],
        title: "Dossier à hasher",
      });
      if (picked.canceled || !picked.filePaths[0]) return null;
      const folder = picked.filePaths[0];
      lastFolder = folder;
      return {
        folder,
        ...(await hashFolder(
          folder,
          patterns(ignore),
          reporter(event.sender, "hash"),
        )),
      };
    },
  );

  // Écrit hash.json + hash/ pour le dossier choisi précédemment
  ipcMain.handle(
    "tools:export-hash",
    async (event, ignore: unknown): Promise<{ output: string } | null> => {
      const source = lastFolder;
      if (!source) throw new LocalizedError("err.pickFolder");
      const picked = await dialog.showOpenDialog(window(), {
        properties: ["openDirectory", "createDirectory"],
        title: "Dossier de sortie (hash.json + hash/)",
      });
      if (picked.canceled || !picked.filePaths[0]) return null;
      const output = picked.filePaths[0];
      if (path.resolve(output) === path.resolve(source))
        throw new LocalizedError("err.sameOutput");
      await exportHashFolder(
        source,
        output,
        patterns(ignore),
        reporter(event.sender, "hash"),
      );
      return { output };
    },
  );

  ipcMain.handle(
    "tools:mods-list",
    async (
      event,
      source: unknown,
      apiChoice?: unknown,
      key?: unknown,
      withDependencies?: unknown,
    ): Promise<ModsListResult> => {
      let text = String(source ?? "").trim();
      const choice: ModsApi = ["thunderstore", "hexium", "nexus"].includes(
        String(apiChoice),
      )
        ? (apiChoice as ModsApi)
        : "auto";
      const listKey = typeof key === "string" ? key : undefined;
      const progress = reporter(event.sender, "mods");
      const fetchJson = async (url: string) =>
        JSON.parse(await httpGetText(url, { timeout: 10_000 })) as unknown;
      const nexusJson = async (url: string) =>
        nexusGetJson(url, await SettingsManager.getSetting("nexusApiKey"));
      const showNexus = (items: string[]) =>
        buildNexusDisplay(items, nexusJson, progress);

      // Page d'un mod : Thunderstore / Hexium (mod + dépendances lus via l'API du site) ou Nexus (fichier principal)
      const page = choice === "nexus" ? null : parsePackagePage(text);
      if (page)
        return buildModsDisplay(
          await refsFromPackagePage(
            page,
            fetchJson,
            undefined,
            withDependencies !== false,
          ),
          fetchJson,
          page.origin,
          progress,
        );
      const nexusPage =
        choice === "thunderstore" || choice === "hexium"
          ? null
          : parseNexusPage(text);
      if (nexusPage)
        return showNexus([await nexusItemFromPage(nexusPage, nexusJson)]);

      // Un lien vers la liste (JSON ou texte) est aussi accepté
      if (/^https?:\/\/\S+$/.test(text))
        text = await httpGetText(text, { timeout: 10_000 });

      // Liste Nexus (`jeu-idMod-idFichier`), lue avec la clé API du joueur (réglage local)
      if (choice === "nexus" || choice === "auto") {
        const items = parseNexusList(text, listKey);
        if (items) return showNexus(items);
        if (choice === "nexus")
          throw new LocalizedError("err.nexusListInvalid");
      }
      const origin = choice === "hexium" ? "https://hexium.gg" : undefined; // défaut : Thunderstore
      return buildModsDisplay(
        parseModList(text, listKey),
        fetchJson,
        origin,
        progress,
      );
    },
  );

  // Fichier de liste (texte ou JSON) choisi par boîte de dialogue : le renderer ne fournit jamais de chemin
  ipcMain.handle(
    "tools:open-text-file",
    async (): Promise<{ name: string; text: string } | null> => {
      const picked = await dialog.showOpenDialog(window(), {
        properties: ["openFile"],
        filters: [{ name: "Liste", extensions: ["txt", "json", "md"] }],
      });
      if (picked.canceled || !picked.filePaths[0]) return null;
      const file = picked.filePaths[0];
      if (fs.statSync(file).size > MAX_TEXT_FILE_BYTES)
        throw new LocalizedError("err.fileTooLarge", { max: "1 Mo" });
      return { name: path.basename(file), text: fs.readFileSync(file, "utf8") };
    },
  );

  ipcMain.handle(
    "tools:save-text",
    async (
      _event,
      defaultName: unknown,
      text: unknown,
    ): Promise<string | null> => {
      const picked = await dialog.showSaveDialog(window(), {
        defaultPath: path.basename(String(defaultName ?? "export.json")),
      });
      if (picked.canceled || !picked.filePath) return null;
      fs.writeFileSync(picked.filePath, String(text ?? ""));
      return picked.filePath;
    },
  );
}
