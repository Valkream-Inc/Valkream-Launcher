/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Build du launcher : obfuscation du main compilé (`.tsbuild/`), copie du renderer
 * (Vite) puis génération des installeurs avec electron-builder.
 *
 * Prérequis (voir les scripts de package.json) :
 *   - `yarn build:main`  -> compile `main/` en JavaScript dans `.tsbuild/`
 *   - `yarn build:react` -> compile le renderer dans `renderer/build/`
 */

import fs from "node:fs";
import path from "node:path";

import * as builder from "electron-builder";
import fse from "fs-extra";
import JavaScriptObfuscator from "javascript-obfuscator";

import { name } from "./package.json";
import type { BuildTarget } from "./types/build";

/** Sortie de `tsc -p main/tsconfig.json`. */
const COMPILED_MAIN_DIR = ".tsbuild";
/** Dossier embarqué par electron-builder (`extraMetadata.main = build/app.js`). */
const BUILD_DIR = "build";

class LauncherBuilder {
  private obf = true;
  private filesList: string[] = [];

  async init(): Promise<void> {
    const obfArg = process.argv.find((arg) => arg.startsWith("--obf="));
    if (obfArg) this.obf = JSON.parse(obfArg.split("=")[1]) as boolean;

    if (!fs.existsSync(COMPILED_MAIN_DIR)) {
      throw new Error(
        `Dossier "${COMPILED_MAIN_DIR}" introuvable : lance d'abord "yarn build:main".`
      );
    }
    this.filesList = this.getFiles(COMPILED_MAIN_DIR);

    await this.cleanBuildAndDist();
    await this.obfuscate();
    await this.copyReact();
    await this.buildAll();
    await this.mergeBuilds();
    console.log("🎉 Build terminée !");
  }

  async cleanBuildAndDist(): Promise<void> {
    console.log("🧹 Nettoyage du dossier build et dist...");
    if (fs.existsSync("./build")) fs.rmSync("./build", { recursive: true });
    if (fs.existsSync("./dist")) fs.rmSync("./dist", { recursive: true });
    console.log("✅ Nettoyage du dossier build et dist terminé !");
  }

  /** Liste récursivement les fichiers d'un dossier (chemins relatifs au cwd). */
  getFiles(dir: string, files: string[] = []): string[] {
    if (!fs.existsSync(dir)) return files;

    for (const entry of fs.readdirSync(dir)) {
      const entryPath = `${dir}/${entry}`;
      if (fs.statSync(entryPath).isDirectory()) this.getFiles(entryPath, files);
      else files.push(entryPath);
    }
    return files;
  }

  async obfuscate(): Promise<void> {
    console.log("🚀 Obfuscation des fichiers...");

    for (const filePath of this.filesList) {
      // Les source maps ne doivent pas être embarquées dans l'application.
      if (filePath.endsWith(".map")) continue;

      const destination = path.join(
        BUILD_DIR,
        path.relative(COMPILED_MAIN_DIR, filePath)
      );
      fs.mkdirSync(path.dirname(destination), { recursive: true });

      if (path.extname(filePath) !== ".js") {
        fs.copyFileSync(filePath, destination);
        continue;
      }

      const code = fs.readFileSync(filePath, "utf8");

      if (this.obf) {
        console.log(`Obfuscate ${filePath}`);
        const obfuscated = JavaScriptObfuscator.obfuscate(code, {
          optionsPreset: "medium-obfuscation",
          target: "node",
          disableConsoleOutput: false,
          transformObjectKeys: false,
          rotateStringArray: true,
          stringArray: true,
          identifierNamesGenerator: "mangled",
        });
        fs.writeFileSync(destination, obfuscated.getObfuscatedCode(), {
          encoding: "utf-8",
        });
      } else {
        console.log(`Copy ${filePath}`);
        fs.writeFileSync(destination, code, { encoding: "utf-8" });
      }
    }
    console.log("✅ Obfuscation terminée !");
  }

  async copyReact(): Promise<void> {
    console.log("🚀 Copy React...");
    if (fs.existsSync("./build/frontend")) {
      fs.rmSync("./build/frontend", { recursive: true });
    }

    fse.copySync("./renderer/build", "./build/frontend");
    console.log("✅ Copy React terminée !");
  }

  async buildAll(): Promise<void> {
    const builds: BuildTarget[] = [
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
            copyright: "Copyright © 2026 Valkream Team",
            // Template electron-builder (résolu par electron-builder, pas par JS).
             
            artifactName: `${name}-${build.type}-` + "${os}-${arch}.${ext}",
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
            win: {
              icon: "./renderer/public/images/icon/icon.ico",
              target: [{ target: "nsis", arch: ["x64"] }],
              // trop de place sur github (pour le moment)
              // target: [{ target: "nsis", arch: ["x64", "arm64", "ia32"] }],
            },
            linux: {
              icon: "./renderer/public/images/icon/icon.png",
              target: [
                {
                  target: "AppImage",
                  arch: ["x64"],
                  // trop de place sur github (pour le moment)
                  // arch: ["x64", "arm64"],
                },
              ],
            },
            mac: {
              icon: "./renderer/public/images/icon/icon.icns",
              category: "public.app-category.games",
              identity: null,
              target: [
                { target: "dmg", arch: ["x64"] },
                { target: "zip", arch: ["x64"] },
                // trop de place sur github (pour le moment)
                // { target: "dmg", arch: ["x64", "arm64", "universal"] },
                // { target: "zip", arch: ["x64", "arm64", "universal"] },
              ],
            },
          },
        })
        .then(() => {
          console.log(`✅ Build ${build.type} terminé !`);
        })
        .catch((err: unknown) => {
          console.error(`❌ Erreur pendant le build ${build.type} !`, err);
        });
    }
  }

  async mergeBuilds(): Promise<void> {
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

new LauncherBuilder().init().catch((err: unknown) => {
  console.error("❌ Build échouée :", err);
  process.exit(1);
});
