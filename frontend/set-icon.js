/**
 * @author Valkream Team
 * @license MIT-NC
 */

const fs = require("fs");
const path = require("path");

const png2icons = require("png2icons");
const Jimp = require("jimp");

async function iconSet() {
  const ImageDir = path.join(__dirname, "renderer/public/images/icon/");
  const PngImg = path.join(ImageDir, "icon.png");
  const IcoImg = path.join(ImageDir, "icon.ico");
  const IcnsImg = path.join(ImageDir, "icon.icns");

  let Buffer;
  if (fs.existsSync(PngImg)) {
    Buffer = fs.readFileSync(PngImg);
  } else {
    console.log("Fichier local introuvable : " + PngImg);
    return;
  }

  const image = await Jimp.read(Buffer);
  Buffer = await image.resize(256, 256).getBufferAsync(Jimp.MIME_PNG);
  fs.writeFileSync(
    IcnsImg,
    png2icons.createICNS(Buffer, png2icons.BILINEAR, 0)
  );
  fs.writeFileSync(
    IcoImg,
    png2icons.createICO(Buffer, png2icons.HERMITE, 0, false)
  );
  console.log("new icon set");
}

iconSet();
