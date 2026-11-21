/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Épingle une release officielle de DepotDownloader dans `depot-config.ts` : télécharge chaque zip
 * reconnu, calcule son sha256 et réécrit le fichier. À lancer par un administrateur (réseau requis).
 *
 *   yarn tsx scripts/pin-depotdownloader.ts <tag>      ex : DepotDownloader_3.4.0
 *   yarn tsx scripts/pin-depotdownloader.ts <tag> --list   affiche seulement les assets de la release
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { DepotAsset } from "../main/src/instances/install/depot-config";
import { platformOfAsset, renderDepotConfig, type ReleaseAsset } from "../main/src/instances/install/depot-pins";

const REPO = "SteamRE/DepotDownloader";
const CONFIG = path.join(__dirname, "../main/src/instances/install/depot-config.ts");

const main = async (): Promise<void> => {
  const [tag, flag] = process.argv.slice(2);
  if (!tag) {
    console.error("Usage : pin-depotdownloader <tag> [--list]");
    process.exit(1);
  }
  const response = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "valkream-launcher" },
  });
  if (!response.ok) throw new Error(`Release introuvable (${response.status}) : ${tag}`);
  const release = (await response.json()) as { assets: { name: string; browser_download_url: string }[] };
  const assets: ReleaseAsset[] = release.assets.map((asset) => ({ name: asset.name, url: asset.browser_download_url }));

  if (flag === "--list") {
    assets.forEach((asset) => console.log(`${platformOfAsset(asset.name)?.key ?? "(ignoré)"}\t${asset.name}`));
    return;
  }

  const pinned: Record<string, DepotAsset> = {};
  for (const asset of assets) {
    const platform = platformOfAsset(asset.name);
    if (!platform) continue;
    const download = await fetch(asset.url);
    if (!download.ok) throw new Error(`Téléchargement impossible : ${asset.url}`);
    const sha256 = createHash("sha256").update(Buffer.from(await download.arrayBuffer())).digest("hex");
    pinned[platform.key] = { url: asset.url, sha256, file: platform.file };
    console.log(`${platform.key}  ${sha256}  ${asset.name}`);
  }
  if (Object.keys(pinned).length === 0) throw new Error("Aucun asset reconnu : lancez avec --list et adaptez depot-pins.ts");
  fs.writeFileSync(CONFIG, renderDepotConfig(tag, pinned));
  console.log(`\n${CONFIG} mis à jour (${Object.keys(pinned).length} plateforme(s)). Vérifiez, committez, publiez le launcher.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
