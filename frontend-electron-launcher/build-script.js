/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");

const builder = require("electron-builder");
const JavaScriptObfuscator = require("javascript-obfuscator");
const nodeFetch = require("node-fetch");
const png2icons = require("png2icons");
const Jimp = require("jimp");

const { name } = require("./package.json");

class Index {
  async init() {
    this.obf = true;
    this.Fileslist = [];
    process.argv.forEach(async (val) => {
      if (val.startsWith("--icon")) {
        return this.iconSet(val.split("=")[1]);
      }

      if (val.startsWith("--obf")) {
        this.obf = JSON.parse(val.split("=")[1]);
        this.Fileslist = this.getFiles("src");
      }

      if (val.startsWith("--build")) {
        let buildType = val.split("=")[1];
        if (buildType == "platform") return await this.buildPlatform();
      }
    });
  }

  async Obfuscate() {
    if (fs.existsSync("./build")) fs.rmSync("./build", { recursive: true });

    for (let path of this.Fileslist) {
      let fileName = path.split("/").pop();
      let extFile = fileName.split(".").pop();
      let folder = path.replace(`/${fileName}`, "").replace("src", "build");

      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      if (extFile == "js") {
        let code = fs.readFileSync(path, "utf8");
        code = code.replace(/src\//g, "build/");
        // ignore main process files that create some problems after being obsfuscate
        if (this.obf && !path.includes("src/main/")) {
          await new Promise((resolve) => {
            console.log(`Obfuscate ${path}`);
            let obf = JavaScriptObfuscator.obfuscate(code, {
              optionsPreset: "medium-obfuscation",
              disableConsoleOutput: false,
            });
            resolve(
              fs.writeFileSync(
                `${folder}/${fileName}`,
                obf.getObfuscatedCode(),
                { encoding: "utf-8" }
              )
            );
          });
        } else {
          console.log(`Copy ${path}`);
          fs.writeFileSync(`${folder}/${fileName}`, code, {
            encoding: "utf-8",
          });
        }
      } else {
        fs.copyFileSync(path, `${folder}/${fileName}`);
      }
    }
  }

  async buildPlatform() {
    await this.Obfuscate();
    builder
      .build({
        config: {
          generateUpdatesFilesForAllChannels: false,
          appId: name,
          productName: name,
          copyright: "Copyright © 2025 Valkream Team",
          artifactName: "${productName}-${os}-${arch}.${ext}",
          extraMetadata: { main: "build/app.js" },
          files: ["build/**/*", "package.json", "LICENSE.md"],
          directories: { output: "dist" },
          compression: "maximum",
          asar: true,
          publish: [
            {
              provider: "github",
              releaseType: "release",
            },
          ],
          win: {
            icon: "./build/assets/images/icon.ico",
            target: [{ target: "nsis", arch: ["x64", "arm64"] }],
          },
          nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            createDesktopShortcut: true,
            createStartMenuShortcut: true,
            runAfterFinish: true,
            deleteAppDataOnUninstall: false,
          },
          mac: {
            icon: "./build/assets/images/icon.icns",
            category: "public.app-category.games",
            identity: null,
            target: [
              { target: "dmg", arch: ["x64", "arm64"] },
              { target: "zip", arch: ["x64", "arm64"] },
            ],
          },
          linux: {
            icon: "./build/assets/images/icon.png",
            target: [{ target: "AppImage", arch: ["x64", "arm64"] }],
          },
        },
      })
      .then(() => {
        console.log("le build est terminé");
      })
      .catch((err) => {
        console.error("Error during build!", err);
      });
  }

  getFiles(path, file = []) {
    if (fs.existsSync(path)) {
      let files = fs.readdirSync(path);
      if (files.length == 0) file.push(path);
      for (let i in files) {
        let name = `${path}/${files[i]}`;
        if (fs.statSync(name).isDirectory()) this.getFiles(name, file);
        else file.push(name);
      }
    }
    return file;
  }

  async iconSet(pathOrUrl) {
    let Buffer;
    if (/^https?:\/\//.test(pathOrUrl)) {
      // Si c'est une URL
      let response = await nodeFetch(pathOrUrl);
      if (response.status == 200) {
        Buffer = await response.buffer();
      } else {
        console.log("connection error");
        return;
      }
    } else {
      // Sinon, on suppose que c'est un chemin local
      if (fs.existsSync(pathOrUrl)) {
        Buffer = fs.readFileSync(pathOrUrl);
      } else {
        console.log("Fichier local introuvable : " + pathOrUrl);
        return;
      }
    }
    const image = await Jimp.read(Buffer);
    Buffer = await image.resize(256, 256).getBufferAsync(Jimp.MIME_PNG);
    fs.writeFileSync(
      "src/assets/images/icon.icns",
      png2icons.createICNS(Buffer, png2icons.BILINEAR, 0)
    );
    fs.writeFileSync(
      "src/assets/images/icon.ico",
      png2icons.createICO(Buffer, png2icons.HERMITE, 0, false)
    );
    fs.writeFileSync("src/assets/images/icon.png", Buffer);
    console.log("new icon set");
  }
}

new Index().init();
