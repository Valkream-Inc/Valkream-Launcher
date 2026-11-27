/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "node:fs";
import path from "node:path";

import { Jimp } from "jimp";
import * as png2icons from "png2icons";

/**
 * Génère le jeu d'icônes complet à partir de la source haute définition (1024 px) :
 * - icon.png  : 512 px (Linux / Electron)
 * - icon.ico  : 16, 24, 32, 48, 64, 128, 256 px (Windows, chaque taille est rééchantillonnée
 *               depuis la source, pas agrandie depuis une petite image)
 * - icon.icns : 16 → 1024 px (macOS, @2x inclus)
 */
async function iconSet(): Promise<void> {
  const sourceImg = path.join(
    import.meta.dirname,
    "renderer/src/assets/icon/Valkream-icon.png",
  );
  const outDir = path.join(import.meta.dirname, "renderer/public/images/icon/");
  const pngImg = path.join(outDir, "icon.png");
  const icoImg = path.join(outDir, "icon.ico");
  const icnsImg = path.join(outDir, "icon.icns");

  if (!fs.existsSync(sourceImg)) {
    console.log("Fichier local introuvable : " + sourceImg);
    return;
  }

  const image = await Jimp.read(fs.readFileSync(sourceImg));
  const size = Math.min(image.width, image.height);
  image.crop({ x: 0, y: 0, w: size, h: size });

  // png2icons génère lui-même chaque taille depuis la source (1024 px) avec l'algorithme choisi.
  const source = await image.getBuffer("image/png");
  const icns = png2icons.createICNS(source, png2icons.BICUBIC, 0);
  // usePNG=false + forWinExe=true : tailles 16→128 en BMP (compat. Explorateur), 256 en PNG.
  const ico = png2icons.createICO(source, png2icons.HERMITE, 0, false, true);
  if (!icns || !ico) throw new Error("Échec de la génération des icônes.");

  const png512 = image.clone().resize({ w: 512, h: 512 });
  fs.writeFileSync(pngImg, await png512.getBuffer("image/png"));
  fs.writeFileSync(icnsImg, icns);
  fs.writeFileSync(icoImg, ico);
  console.log("new icon set");
}

iconSet().catch((err: unknown) => {
  console.error("❌ Impossible de générer les icônes :", err);
  process.exit(1);
});
