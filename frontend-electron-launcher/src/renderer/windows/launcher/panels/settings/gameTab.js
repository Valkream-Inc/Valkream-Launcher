const {
  ThunderstoreManager,
  VersionManager,
} = require(window.PathsManager.getUtils());

const axios = require("axios");

class GameTab {
  constructor() {
    this.hash = {
      pluginLocalHash: "1234567890",
      pluginOnlineHash: "1234567890",
      configLocalHash: "123456790",
      configOnlineHash: "1234567890",
    };

    this._initAbortController = null;
    this._timeoutId = null;
  }

  async init() {
    const abortController = new AbortController();
    this._initAbortController = abortController;
    const { signal } = abortController;

    this.gameTabContainer = document.querySelector("#game-tab");
    if (!this.gameTabContainer || signal.aborted) return;

    if (
      window.isServerReachable === null ||
      window.isServerReachable === undefined
    ) {
      this._timeoutId = setTimeout(() => {
        if (!signal.aborted) this.init();
      }, 100);
      return;
    }

    if (signal.aborted) return;

    this.gameTabContainer.appendChild(this.createLegendBox());

    if (window.isServerReachable && !signal.aborted) {
      await this.getModpackList((modInfo) => {
        if (!signal.aborted) {
          const box = this.createGameInfoBox(modInfo);
          this.gameTabContainer.appendChild(box);
        }
      }, signal);
    }

    if (!signal.aborted) {
      this.gameTabContainer.appendChild(this.createHashTableBox(this.hash));
    }
  }

  reload() {
    if (this._initAbortController) {
      this._initAbortController.abort();
      this._initAbortController = null;
    }

    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }

    const container = document.querySelector("#game-tab");
    container.innerHTML = '<div class="titre-tab">Mods Infos</div>';

    this.init();
  }

  getModpackList = async (onModLoaded, signal) => {
    const delay = (ms) =>
      new Promise((res) => {
        const id = setTimeout(() => {
          if (!signal?.aborted) res();
        }, ms);
      });

    const onlineValkreamVersion = (
      await VersionManager.getOnlineVersionConfig()
    ).version;

    const installedModsRaw = await ThunderstoreManager.getInstalledMods();
    const installedMods = [
      ...installedModsRaw.filter((mod) => !mod.endsWith(".dll")),
    ].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }));

    let onlineMods = [];
    try {
      if (signal?.aborted) return;

      const res = await axios.get(
        `https://thunderstore.io/api/experimental/package/ValheimValkream/Valkream/${onlineValkreamVersion}/`
      );
      onlineMods = res.data?.dependencies || [];
    } catch (err) {
      console.error("Erreur récupération des dépendances :", err);
    }

    const allMods = [
      {
        mod: `ValheimValkream-Valkream-${onlineValkreamVersion}`,
        installed: true,
      },
      {
        mod: `denikson-BepInExPack_Valheim-${
          (await VersionManager.getLocalVersionConfig()).bepinex.version
        }`,
        installed: true,
      },
      ...installedMods.map((mod) => ({ mod, installed: true })),
      ...onlineMods
        .filter(
          (mod) =>
            !installedMods.some((m) =>
              m.startsWith(mod.split("-").slice(0, 2).join("-"))
            )
        )
        .map((mod) => ({ mod, installed: false })),
    ];

    for (const [i, { mod, installed }] of allMods.entries()) {
      if (signal?.aborted) return;
      try {
        const [author, name, version] = mod.split("-");
        await delay(200);

        if (signal?.aborted) return;

        const res = await axios.get(
          `https://thunderstore.io/api/experimental/package/${author}/${name}/`
        );

        const latest = res.data?.latest;

        const modInfo = {
          name: `${author} - ${name}`,
          localVersion: installed ? version : "?",
          onlineVersion: installed
            ? onlineMods
                .find((m) => m.startsWith(`${author}-${name}-`))
                ?.split("-")[2]
            : version,
          LastBuild: latest?.version_number,
          description: latest?.description,
          icon: latest?.icon,
        };

        if (typeof onModLoaded === "function") {
          onModLoaded(modInfo);
        }
      } catch (err) {
        console.warn(`Erreur lors du chargement du mod ${mod} :`, err);
        if (typeof onModLoaded === "function") {
          onModLoaded({
            name: mod,
            localVersion: installed ? mod.split("-")[2] : null,
            onlineVersion: null,
            LastBuild: null,
            description: "Erreur de chargement",
            icon: null,
            error: true,
          });
        }
      }
    }
  };

  createGameInfoBox(gameData) {
    const container = document.createElement("div");
    container.classList.add("game-info-box");

    if (!gameData.localVersion || !gameData.onlineVersion) {
      container.classList.add("incomplete");
    } else {
      if (gameData.localVersion !== gameData.onlineVersion)
        container.classList.add("not-uptodate");
      if (gameData.LastBuild !== gameData.onlineVersion)
        container.classList.add("update-available");
    }

    const topSection = document.createElement("div");
    topSection.classList.add("game-info-top");

    const icon = document.createElement("img");
    icon.src = gameData.icon || "icon.png";
    icon.alt = "Icône du jeu";
    icon.classList.add("game-info-icon");

    const textContainer = document.createElement("div");

    const title = document.createElement("h2");
    title.textContent = gameData.name;
    title.classList.add("game-info-title");

    const description = document.createElement("p");
    description.textContent = gameData.description;
    description.classList.add("game-info-description");

    textContainer.appendChild(title);
    textContainer.appendChild(description);

    topSection.appendChild(icon);
    topSection.appendChild(textContainer);

    const versionTable = document.createElement("table");
    versionTable.classList.add("game-version-table");

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    ["Version locale", "Version en ligne", "Dernier build"].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);

    const tbody = document.createElement("tbody");
    const bodyRow = document.createElement("tr");

    [gameData.localVersion, gameData.onlineVersion, gameData.LastBuild].forEach(
      (val) => {
        const td = document.createElement("td");
        td.textContent = val || "-";
        bodyRow.appendChild(td);
      }
    );
    tbody.appendChild(bodyRow);

    versionTable.appendChild(thead);
    versionTable.appendChild(tbody);

    container.appendChild(topSection);
    container.appendChild(versionTable);

    return container;
  }

  createLegendBox() {
    const legend = document.createElement("div");
    legend.classList.add("update-legend");

    const items = [
      {
        className: "available",
        label: "Mise à jour disponible pour le modpack",
      },
      {
        className: "outdated",
        label: "Version local inégale à la version du modpack",
      },
      {
        className: "outdated-available",
        label:
          "Version local inégale à la version du modpack et mise à jour disponible pour le modpack",
      },
      {
        className: "incomplete",
        label:
          "Mods non présent dans le modpack mais installés,ou mods non installés mais présents dans le modpack (ex: les mods admin et BepInEx)",
      },
    ];

    items.forEach(({ className, label }) => {
      const item = document.createElement("div");
      item.classList.add("update-legend-item");

      const colorBox = document.createElement("span");
      colorBox.classList.add("update-color", className);

      const text = document.createElement("span");
      text.textContent = label;

      item.appendChild(colorBox);
      item.appendChild(text);
      legend.appendChild(item);
    });

    return legend;
  }

  createHashTableBox(hash) {
    const {
      pluginLocalHash,
      pluginOnlineHash,
      configLocalHash,
      configOnlineHash,
    } = hash;

    const container = document.createElement("div");
    container.classList.add("hash-table-box");

    const title = document.createElement("h3");
    title.textContent = "Vérification des fichiers (hash)";
    container.appendChild(title);

    const table = document.createElement("table");
    table.classList.add("hash-table");

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");

    ["Dossier", "Hachage local", "Hachage distant", "État"].forEach((text) => {
      const th = document.createElement("th");
      th.textContent = text;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    const rows = [
      {
        label: "Plugins",
        local: pluginLocalHash,
        online: pluginOnlineHash,
      },
      {
        label: "Config",
        local: configLocalHash,
        online: configOnlineHash,
      },
    ];

    rows.forEach(({ label, local, online }) => {
      const tr = document.createElement("tr");

      const tdLabel = document.createElement("td");
      tdLabel.textContent = label;

      const tdLocal = document.createElement("td");
      tdLocal.textContent = local;

      const tdOnline = document.createElement("td");
      tdOnline.textContent = online;

      const tdState = document.createElement("td");
      const same = local === online;
      tdState.textContent = same ? "✅ OK" : "❌ Différent";
      tdState.classList.add(same ? "hash-ok" : "hash-diff");

      tr.appendChild(tdLabel);
      tr.appendChild(tdLocal);
      tr.appendChild(tdOnline);
      tr.appendChild(tdState);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    return container;
  }
}

module.exports = GameTab;
