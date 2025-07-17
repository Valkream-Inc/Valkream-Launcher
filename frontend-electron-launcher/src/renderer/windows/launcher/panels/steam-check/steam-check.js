const fs = require("fs");
const path = require("path");
const { ipcRenderer, shell } = require("electron");
const { isSteamInstallation } = require(PathsManager.getConstants());
const { changePanel } = require(PathsManager.getUtils());
const { database } = require(PathsManager.getSharedUtils());

class SteamCheck {
  static id = "steam-check";

  constructor() {
    this.currentSteamDir = null;
    this.db = new database();

    // Ajout des chemins par défaut pour chaque OS
    let defaultSteamPaths = [];
    if (process.platform === "win32") {
      defaultSteamPaths = [
        process.env["PROGRAMFILES(X86)"],
        process.env["PROGRAMFILES"],
        "C:/Program Files (x86)",
        "C:/Program Files",
      ]
        .filter(Boolean)
        .map((base) => path.join(base, "Steam"));
    } else if (process.platform === "linux") {
      defaultSteamPaths = [
        path.join(process.env.HOME || "~", ".steam/steam"),
        path.join(process.env.HOME || "~", ".local/share/Steam"),
        "/usr/lib/steam",
        "/usr/local/share/steam",
      ];
    } else if (process.platform === "darwin") {
      defaultSteamPaths = [
        path.join(process.env.HOME || "~", "Library/Application Support/Steam"),
      ];
    }
    this.STEAM_PATHS = defaultSteamPaths;

    this.VALHEIM_RELATIVE = path.join("steamapps", "common", "Valheim");
  }

  async init() {
    if (!isSteamInstallation) return changePanel("home");

    const configClient = await this.db.readData("configClient");
    const steamPath = configClient?.launcher_config?.steam_path;
    if (steamPath) {
      this.STEAM_PATHS.push(steamPath);
    }

    this.chooseSteamFolderBtn = document.getElementById("choose-steam-folder");
    this.chooseSteamFolderBtn.addEventListener("click", async () => {
      const dir = await ipcRenderer.invoke("choose-steam-folder");
      if (dir) {
        if (!(await this.isValidSteamFolder(dir))) {
          this.displayInvalidSteamFolderError(dir);
          return;
        }
        this.currentSteamDir = dir;
        await this.mainCheck(this.currentSteamDir);
      }
    });

    await this.mainCheck();
  }

  async checkSteam(steamDir) {
    if (steamDir && fs.existsSync(steamDir)) return steamDir;

    for (const p of this.STEAM_PATHS) {
      if (fs.existsSync(p) && this.isValidSteamFolder(p)) return p;
    }
    return null;
  }

  async checkValheim(steamDir) {
    const valheimPath = path.join(steamDir, this.VALHEIM_RELATIVE);
    return fs.existsSync(valheimPath);
  }

  async isValidSteamFolder(dir) {
    // Vérifie la présence de Steam.exe ou du dossier steamapps
    const steamExe = path.join(dir, "Steam.exe");
    const steamApps = path.join(dir, "steamapps");
    return fs.existsSync(steamExe) || fs.existsSync(steamApps);
  }

  displayInvalidSteamFolderError(dir) {
    const errorMessage = document.getElementById("error-message");
    const steamSolutions = document.getElementById("steam-solutions");
    errorMessage.textContent = `Le dossier sélectionné n'est pas un dossier Steam valide : ${dir}`;
    steamSolutions.style.display = "";
    steamSolutions.innerHTML = `
      <ul>
        <li>Veuillez sélectionner le dossier où Steam est installé (contenant Steam.exe ou le dossier steamapps).</li>
      </ul>
    `;
  }

  setStatus(el, ok, msg) {
    el.textContent = msg;
    el.classList.remove("ok", "ko");
    el.classList.add(ok ? "ok" : "ko");
  }

  displayError({ steamFound, valheimFound }) {
    const steamSolutions = document.getElementById("steam-solutions");
    const errorMessage = document.getElementById("error-message");
    const chooseSteamFolderBtn = this.chooseSteamFolderBtn;

    steamSolutions.style.display = "";
    chooseSteamFolderBtn.style.display = "";

    if (!steamFound) {
      this.setStatus(
        document.getElementById("steam-status"),
        false,
        "Non trouvé"
      );
      this.setStatus(
        document.getElementById("valheim-status"),
        false,
        "Inconnu"
      );

      errorMessage.textContent = "Steam n'a pas été détecté sur votre système.";

      steamSolutions.innerHTML = `
        <ul>
          <li>Installer Steam depuis <a href="https://store.steampowered.com/about/" target="_blank">le site officiel</a>.</li>
          <li>Vérifier que Steam est bien installé sur ce PC.</li>
          <li>Choisir manuellement le dossier Steam ci-dessous.</li>
        </ul>
      `;
    } else if (!valheimFound) {
      this.setStatus(
        document.getElementById("valheim-status"),
        false,
        "Non trouvé"
      );

      errorMessage.textContent =
        "Valheim n'a pas été détecté dans votre bibliothèque Steam.";

      steamSolutions.innerHTML = `
        <ul>
          <li>Installer Valheim via Steam.</li>
          <li>Vérifier que Valheim est bien installé dans Steam.</li>
          <li>Si vous avez déplacé le dossier, choisissez le bon dossier Steam.</li>
        </ul>
        <button id="open-steam" class="open-steam-btn">Ouvrir Steam</button>
      `;
    }

    document.getElementById("open-steam").onclick = () => {
      shell.openExternal("steam://open/games");
    };
  }

  async mainCheck(steamDir = null) {
    const steamStatus = document.getElementById("steam-status");
    const valheimStatus = document.getElementById("valheim-status");
    const errorMessage = document.getElementById("error-message");
    const steamSolutions = document.getElementById("steam-solutions");

    errorMessage.textContent = "";
    steamSolutions.style.display = "none";

    const foundSteam = await this.checkSteam(steamDir);
    if (!foundSteam) {
      this.displayError({ steamFound: false });
      return;
    }

    await this.db.updateData("configClient", {
      launcher_config: {
        steam_path: foundSteam,
      },
    });

    this.setStatus(steamStatus, true, "OK");
    this.chooseSteamFolderBtn.style.display = "none";

    const foundValheim = await this.checkValheim(foundSteam);
    if (!foundValheim) {
      this.displayError({ steamFound: true, valheimFound: false });
      return;
    }

    await this.db.updateData("configClient", {
      launcher_config: {
        valheim_steam_path: foundValheim,
      },
    });

    this.setStatus(valheimStatus, true, "OK");
    errorMessage.textContent = "";
    steamSolutions.style.display = "none";

    changePanel("home");
  }
}

module.exports = SteamCheck;
