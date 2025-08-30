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

    await this.Obfuscate();
    await this.buildAll();
    await this.mergeBuilds();
    console.log("🎉 Build terminée !");
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
    console.log("✅ Obfuscation terminée !");
  }

  async buildAll() {
    const builds = [
      {
        type: "install",
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          runAfterFinish: true,
          deleteAppDataOnUninstall: true,
          removeDefaultUninstallWelcomePage: true,
          include: "./installer.nsh",
        },
      },
      {
        type: "update",
        nsis: {
          oneClick: true,
          allowToChangeInstallationDirectory: false,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          runAfterFinish: true,
          deleteAppDataOnUninstall: true,
          removeDefaultUninstallWelcomePage: true,
          include: "./installer.nsh",
        },
      },
    ];

    for (const build of builds) {
      const outputDir = `dist/temp-${build.type}`;
      console.log(`\n🚀 Building ${build.type} version...`);

      await builder
        .build({
          config: {
            generateUpdatesFilesForAllChannels: false,
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
            extraResources: [{ from: "data/", to: "data", filter: ["**/*"] }],
            publish: [{ provider: "github", releaseType: "release" }],
            win: {
              icon: "./renderer/public/images/icon/icon.ico",
              target: [{ target: "nsis", arch: ["x64", "arm64"] }],
            },
            nsis: build.nsis,
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
          console.log(`✅ Build ${build.type} terminé !`);
        })
        .catch((err) => {
          console.error(`❌ Erreur pendant le build ${build.type} !`, err);
        });
    }
  }

  async mergeBuilds() {
    console.log("\n🔀 Fusion des builds dans dist...");

    const distDir = "dist";
    const tempInstall = "dist/temp-install";
    const tempUpdate = "dist/temp-update";
    const latestFile = "latest.yml";

    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    const copyRecursive = (src, dest, ignoreFiles = []) => {
      if (!fs.existsSync(src)) return;
      const stats = fs.statSync(src);
      if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((child) => {
          if (ignoreFiles.includes(child)) return;
          copyRecursive(path.join(src, child), path.join(dest, child));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    // Copier install → dist
    copyRecursive(tempInstall, distDir, [latestFile]);

    // Copier update → dist, ignorer latest.yml
    copyRecursive(tempUpdate, distDir, [latestFile]);

    // Copier latest.yml depuis update → dist
    const latestSrc = path.join(tempUpdate, latestFile);
    const latestDest = path.join(distDir, latestFile);
    fse.copySync(latestSrc, latestDest, { overwrite: true });

    // Supprimer dossiers temporaires
    fs.rmSync(tempInstall, { recursive: true, force: true });
    fs.rmSync(tempUpdate, { recursive: true, force: true });

    console.log("✅ Fusion terminée !");
  }
}

new Index().init();
