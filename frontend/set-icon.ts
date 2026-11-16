/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "node:fs";
import path from "node:path";

import Jimp from "jimp";
import * as png2icons from "png2icons";

async function iconSet(): Promise<void> {
  const imageDir = path.join(__dirname, "renderer/public/images/icon/");
  const pngImg = path.join(imageDir, "icon.png");
  const icoImg = path.join(imageDir, "icon.ico");
  const icnsImg = path.join(imageDir, "icon.icns");

  if (!fs.existsSync(pngImg)) {
    console.log("Fichier local introuvable : " + pngImg);
    return;
  }

  const image = await Jimp.read(fs.readFileSync(pngImg));
  image.resize({ w: 256, h: 256 });
  const buffer = await image.getBuffer("image/png");

  const icns = png2icons.createICNS(buffer, png2icons.BILINEAR, 0);
  const ico = png2icons.createICO(buffer, png2icons.HERMITE, 0, false);
  if (!icns || !ico) throw new Error("Échec de la génération des icônes.");

  fs.writeFileSync(icnsImg, icns);
  fs.writeFileSync(icoImg, ico);
  console.log("new icon set");
}

iconSet().catch((err: unknown) => {
  console.error("❌ Impossible de générer les icônes :", err);
  process.exit(1);
});
