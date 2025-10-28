/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

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
      }
    });

    await this.cleanBuildAndDist();
    await this.Obfuscate();
    await this.copyReact();
    await this.buildAll();
    await this.mergeBuilds();
    console.log("🎉 Build terminée !");
  }

  async cleanBuildAndDist() {
    console.log("🧹 Nettoyage du dossier build et dist...");
    if (fs.existsSync("./build")) fs.rmSync("./build", { recursive: true });
    if (fs.existsSync("./dist")) fs.rmSync("./dist", { recursive: true });
    console.log("✅ Nettoyage du dossier build et dist terminé !");
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
    console.log("🚀 Obfuscation des fichiers...");

    for (let path of this.Fileslist) {
      let fileName = path.split("/").pop();
      let extFile = fileName.split(".").pop();
      let folder = path.replace(`/${fileName}`, "").replace("main", "build");

      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

      if (extFile === "js") {
        let code = fs.readFileSync(path, "utf8");

        if (this.obf) {
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
    console.log("✅ Obfuscation terminée !");
  }

  async copyReact() {
    console.log("🚀 Copy React...");
    if (fs.existsSync("./build/frontend")) fs.rmSync("./build/frontend");

    fse.copySync("./renderer/build", "./build/frontend");
    console.log("✅ Copy React terminée !");
  }

  async buildAll() {
    const builds = [
      {
        type: "install",
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          differentialPackage: false, // inutile pour l'install
        },
      },
      {
        type: "update",
        nsis: {
          oneClick: true,
          allowToChangeInstallationDirectory: false,
          differentialPackage: true, // 💡 active la génération des .blockmap
        },
      },
    ];

    for (const build of builds) {
      const outputDir = `dist/temp-${build.type}`;
      console.log(`\n🚀 Building ${build.type} version...`);

      await builder
        .build({
          config: {
            generateUpdatesFilesForAllChannels: true,
            appId: name,
            productName: name,
            copyright: "Copyright © 2025 Valkream Team",
            // eslint-disable-next-line no-template-curly-in-string
            artifactName: `${name}-${build.type}-${"${os}-${arch}.${ext}"}`,
            extraMetadata: { main: "build/app.js" },
            files: ["build/**/*", "package.json", "LICENSE.md"],
            directories: { output: outputDir },
            compression: "maximum",
            asar: true,
            publish: [
              {
                provider: "github",
                releaseType: "release",
                repo: "Valkream-Launcher",
                owner: "Valkream-Inc",
              },
            ],
            win: {
              icon: "./renderer/public/images/icon/icon.ico",
              target: [{ target: "nsis", arch: ["x64", "arm64", "ia32"] }],
            },
            nsis: {
              ...build.nsis,
              createDesktopShortcut: true,
              createStartMenuShortcut: true,
              runAfterFinish: true,
              deleteAppDataOnUninstall: true,
              removeDefaultUninstallWelcomePage: false,
              perMachine: false,
              include: "./installer.nsh",
            },
            mac: {
              icon: "./renderer/public/images/icon/icon.icns",
              category: "public.app-category.games",
              identity: null,
              target: [
                { target: "dmg", arch: ["x64", "arm64", "ia32", "universal"] },
                { target: "zip", arch: ["x64", "arm64", "ia32", "universal"] },
              ],
            },
            linux: {
              icon: "./renderer/public/images/icon/icon.png",
              target: [
                {
                  target: "AppImage",
                  arch: ["x64", "arm64", "ia32", "universal"],
                },
              ],
            },
          },
        })
        .then(() => {
          console.log(`✅ Build ${build.type} terminé !`);
        })
        .catch((err) => {
          console.error(`❌ Erreur pendant le build ${build.type} !`, err);
        });
    }
  }

  async mergeBuilds() {
    // step for local build
    console.log("\n🔀 Fusion des builds dans dist...");

    const distDir = "dist";
    const tempInstall = "dist/temp-install";
    const tempUpdate = "dist/temp-update";
    const latestFile = "latest.yml";

    // La fonction 'filter' permet d'ignorer le fichier latest.yml
    fse.copySync(tempInstall, distDir, {
      overwrite: true,
      filter: (src) => !src.includes(latestFile),
    });
    fse.copySync(tempUpdate, distDir, {
      overwrite: true,
      filter: (src) => !src.includes(latestFile),
    });

    // Copie le fichier latest.yml de manière explicite
    const latestSrc = path.join(tempUpdate, latestFile);
    const latestDest = path.join(distDir, latestFile);
    if (fs.existsSync(latestSrc)) {
      fse.copySync(latestSrc, latestDest, { overwrite: true });
    }

    // Supprime les dossiers temporaires
    fse.removeSync(tempInstall);
    fse.removeSync(tempUpdate);

    console.log("✅ Fusion terminée !");
  }
}

new Index().init();
