const fs = require("fs");

const builder = require("electron-builder");
const JavaScriptObfuscator = require("javascript-obfuscator");
const nodeFetch = require("node-fetch");
const Jimp = require("jimp");

const { name } = require("../package.json");

class Index {
  async init() {
    this.obf = true;
    this.Fileslist = [];
    await this.updateVersion();
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

  async updateVersion() {
    try {
      const data = fs.readFileSync("./package.json", "utf8");
      const json = JSON.parse(data);

      // Incrémentation du numéro de patch (ex: 1.0.3 → 1.0.4)
      const versionParts = json.version.split(".");
      versionParts[2] = parseInt(versionParts[2]) + 1;
      json.version = versionParts.join(".");

      fs.writeFileSync("./package.json", JSON.stringify(json, null, 2));
      console.log(`✅ Version mise à jour : ${json.version}`);
    } catch (err) {
      console.error("❌ Erreur lors de la mise à jour de la version :", err);
    }
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
        if (this.obf) {
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
            icon: "./build/assets/images/icon.png",
            target: [
              {
                target: "nsis",
                arch: "x64",
              },
            ],
          },
          nsis: {
            oneClick: true,
            allowToChangeInstallationDirectory: false,
            createDesktopShortcut: true,
            runAfterFinish: true,
          },
          mac: {
            icon: "./build/assets/images/icon.png",
            category: "public.app-category.games",
            identity: null,
            target: [
              {
                target: "dmg",
                arch: "universal",
              },
              {
                target: "zip",
                arch: "universal",
              },
            ],
          },
          linux: {
            icon: "./build/assets/images/icon.png",
            target: [
              {
                target: "AppImage",
                arch: "x64",
              },
            ],
          },
        },
      })
      .then(() => {
        console.log("✅ Build terminé !");

        if (fs.existsSync("./build")) {
          fs.rmSync("./build", { recursive: true });
          console.log("✅ Dossier de build supprimé !");
        }
      })
      .catch((err) => {
        console.error("❌ Erreur lors du build :", err);
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

  async iconSet(url) {
    let Buffer = await nodeFetch(url);
    if (Buffer.status == 200) {
      Buffer = await Buffer.buffer();
      const image = await Jimp.read(Buffer);
      Buffer = await image.resize(256, 256).getBufferAsync(Jimp.MIME_PNG);
      fs.writeFileSync("src/assets/images/icon.png", Buffer);
      console.log("new icon set");
    } else {
      console.log("connection error");
    }
  }
}

new Index().init();
