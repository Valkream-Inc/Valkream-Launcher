/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");

const builder = require("electron-builder");
const JavaScriptObfuscator = require("javascript-obfuscator");

const { name } = require("./package.json");

class Index {
  async init() {
    this.obf = true;
    this.Fileslist = this.getFiles("main");

    process.argv.forEach(async (val) => {
      if (val.startsWith("--obf")) {
        this.obf = JSON.parse(val.split("=")[1]);
        return await this.buildPlatform();
      }
    });
  }

  getFiles(path, file = []) {
    if (fs.existsSync(path)) {
      let files = fs.readdirSync(path);
      if (files.length === 0) file.push(path);
      for (let i in files) {
        let name = `${path}/${files[i]}`;
        if (fs.statSync(name).isDirectory()) this.getFiles(name, file);
        else file.push(name);
      }
    }
    return file;
  }

  async Obfuscate() {
    if (fs.existsSync("./build")) fs.rmSync("./build", { recursive: true });

    for (let path of this.Fileslist) {
      let fileName = path.split("/").pop();
      let extFile = fileName.split(".").pop();
      let folder = path.replace(`/${fileName}`, "").replace("main", "build");

      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      if (extFile === "js") {
        let code = fs.readFileSync(path, "utf8");
        // ignore main process files that makes problems after being obfuscated
        if (this.obf && !path.includes("main/preload")) {
          console.log(`Obfuscate ${path}`);
          let obf = JavaScriptObfuscator.obfuscate(code, {
            optionsPreset: "medium-obfuscation",
            disableConsoleOutput: false,
          });
          fs.writeFileSync(`${folder}/${fileName}`, obf.getObfuscatedCode(), {
            encoding: "utf-8",
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
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: "${productName}-${os}-${arch}.${ext}",
          extraMetadata: { main: "build/app.js" },
          files: ["build/**/*", "package.json", "LICENSE.md"],
          directories: { output: "dist" },
          compression: "maximum",
          asar: true,
          extraResources: [
            {
              from: "data/",
              to: "data",
              filter: ["**/*"],
            },
          ],
          publish: [
            {
              provider: "github",
              releaseType: "release",
            },
          ],
          win: {
            icon: "./renderer/public/images/icon/icon.ico",
            target: [{ target: "nsis", arch: ["x64", "arm64"] }],
          },
          nsis: {
            oneClick: false,
            allowToChangeInstallationDirectory: true,
            createDesktopShortcut: true,
            createStartMenuShortcut: true,
            runAfterFinish: true,
            deleteAppDataOnUninstall: false,
            removeDefaultUninstallWelcomePage: true,
            include: "./installer.nsh",
          },
          mac: {
            icon: "./renderer/public/images/icon/icon.icns",
            category: "public.app-category.games",
            identity: null,
            target: [
              { target: "dmg", arch: ["x64", "arm64"] },
              { target: "zip", arch: ["x64", "arm64"] },
            ],
          },
          linux: {
            icon: "./renderer/public/images/icon/icon.png",
            target: [{ target: "AppImage", arch: ["x64", "arm64"] }],
          },
        },
      })
      .then(() => {
        console.log("🎉 Le build Electron + React est terminé");
      })
      .catch((err) => {
        console.error("❌ Error during build!", err);
      });
  }
}

new Index().init();
