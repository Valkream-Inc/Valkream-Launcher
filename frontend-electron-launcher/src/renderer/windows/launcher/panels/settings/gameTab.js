const {
  ThunderstoreManager,
  VersionManager,
} = require(window.PathsManager.getUtils());
const { database } = require(window.PathsManager.getSharedUtils());

const axios = require("axios");

class GameTab {
  constructor() {
    this.db = new database();

    this._initAbortController = null;
    this._timeoutId = null;

    this.stats = {
      total: 0,
      processed: 0,
      updatesAvailable: 0,
      errors: 0,
    };
    this.legendStatsTable = null;

    this.hash = {
      pluginLocalHash: "?",
      pluginOnlineHash: "?",
      configLocalHash: "?",
      configOnlineHash: "?",
    };
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

    if (!signal.aborted) {
      await this.getModpackList((modInfo) => {
        if (signal.aborted) return;
        const box = this.createGameInfoBox(modInfo);
        this.gameTabContainer.appendChild(box);
      }, signal);
      await this.getHash();
    }

    if (!signal.aborted && !window.isMainProcessRunning) {
      this.gameTabContainer.appendChild(this.createHashTableBox(this.hash));
    }
  }

  stop() {
    if (this._initAbortController) {
      this._initAbortController.abort();
      this._initAbortController = null;
    }

    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }

    return;
  }

  async reload() {
    this.stop();

    const container = document.querySelector("#game-tab");
    container.innerHTML = '<div class="titre-tab">Mods Infos</div>';

    this.stats = {
      total: 0,
      processed: 0,
      updatesAvailable: 0,
      errors: 0,
    };

    this.legendStatsTable = null;

    this.init();
  }

  getModpackList = async (onModLoaded, signal) => {
    const delay = (ms) =>
      new Promise((res) => {
        const id = setTimeout(() => {
          if (!signal?.aborted) res();
        }, ms);
      });

    const onlineValkreamInfo = await VersionManager.getOnlineVersionConfig();
    const localValkreamInfo = await VersionManager.getLocalVersionConfig();

    const onlineValkreamVersion = onlineValkreamInfo?.version || "";
    const localValkreamVersion = localValkreamInfo?.version || "";
    const onlineValkreamBepinexVersion =
      onlineValkreamInfo?.bepinex?.version || "";
    const localValkreamBepinexVersion =
      localValkreamInfo?.bepinex?.version || "";
    const adminMods = onlineValkreamInfo?.modpack?.admin_mods || [];

    const installedModsRaw = await ThunderstoreManager.getInstalledMods();
    const installedMods = installedModsRaw.filter(
      (mod) => !mod.endsWith(".dll")
    );

    let onlineMods = [];
    try {
      if (signal?.aborted) return;

      const res = await axios.get(
        `https://thunderstore.io/api/experimental/package/ValheimValkream/Valkream/${onlineValkreamVersion}/`
      );
      onlineMods = res.data?.dependencies || [];

      const configData = await this.db.readData("configClient");
      if (configData?.launcher_config?.boostfpsEnabled) {
        const boostfpsMods = onlineValkreamInfo?.modpack?.boostfps_mods || [];
        onlineMods.push(...boostfpsMods);
      }
    } catch (err) {
      console.error("Erreur récupération des dépendances :", err);
    }

    const getModId = (modName) => modName.split("-").slice(0, 2).join("-");
    const getModVersion = (modName) => modName.split("-").slice(2).join("-");

    const allMods = [
      {
        mod: `ValheimValkream-Valkream-${localValkreamVersion}`,
        installed: true,
        type: "special",
        onlineVersion: onlineValkreamVersion,
      },
      {
        mod: `denikson-BepInExPack_Valheim-${localValkreamBepinexVersion}`,
        installed: true,
        type: "special",
        onlineVersion: onlineValkreamBepinexVersion,
      },
      ...installedMods.map((mod) => ({
        mod,
        installed: true,
        type: adminMods.some((adminMod) => getModId(adminMod) === getModId(mod))
          ? "admin"
          : "normal",
        onlineVersion: adminMods.some(
          (adminMod) => getModId(adminMod) === getModId(mod)
        )
          ? getModVersion(
              adminMods.find(
                (adminMod) => getModId(adminMod) === getModId(mod)
              ) || mod
            )
          : undefined,
      })),
      ...onlineMods
        .filter(
          (mod) =>
            !installedMods.some((m) =>
              m.startsWith(mod.split("-").slice(0, 2).join("-"))
            )
        )
        .map((mod) => ({
          mod,
          installed: false,
          type: adminMods.some(
            (adminMod) => getModId(adminMod) === getModId(mod)
          )
            ? "admin"
            : "normal",
          onlineVersion: adminMods.some(
            (adminMod) => getModId(adminMod) === getModId(mod)
          )
            ? getModVersion(
                adminMods.find(
                  (adminMod) => getModId(adminMod) === getModId(mod)
                ) || mod
              )
            : undefined,
        })),
    ].sort((a, b) => {
      const typeOrder = { special: 0, admin: 1, normal: 2 };
      const typeDiff = typeOrder[a.type] - typeOrder[b.type];
      return typeDiff !== 0
        ? typeDiff
        : a.mod.localeCompare(b.mod, "fr", { sensitivity: "base" });
    });

    for (const [
      i,
      { mod, installed, type, onlineVersion },
    ] of allMods.entries()) {
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
          localVersion: installed ? version : null,
          onlineVersion: onlineVersion
            ? onlineVersion
            : installed
            ? onlineMods
                .find((m) => m.startsWith(`${author}-${name}-`))
                ?.split("-")[2]
            : version,
          LastBuild: latest?.version_number,
          description: latest?.description,
          icon: latest?.icon,
          type,
          installed,
        };

        if (typeof onModLoaded === "function") {
          onModLoaded(modInfo);
        }

        if (modInfo.LastBuild !== modInfo.onlineVersion)
          this.stats.updatesAvailable++;

        if (modInfo.localVersion !== modInfo.onlineVersion) this.stats.errors++;
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
      } finally {
        this.stats.total = allMods.length;
        this.stats.processed++;
        this.updateLegendStatsTable();
      }
    }
  };

  createGameInfoBox(gameData) {
    const container = document.createElement("div");
    container.classList.add("game-info-box");

    const { type, localVersion, onlineVersion, LastBuild, installed } =
      gameData;

    // class
    if (type === "admin") container.classList.add("admin");
    else if (type === "special") container.classList.add("special");
    else container.classList.add("normal");

    if (localVersion !== onlineVersion) container.classList.add("outdated");
    if (LastBuild !== onlineVersion)
      container.classList.add("update-available");
    if (!installed) container.classList.add("uninstalled");
    if (!onlineVersion) container.classList.add("uninprod");

    // content
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
      { className: "special-ok", label: "Mods spéciaux installés" },
      {
        className: "special-update-available",
        label: "Mods spéciaux à mettre à jour dans le modpack",
      },
      { className: "admin-ok", label: "Mods admin installés" },
      {
        className: "admin-update-available",
        label: "Mods admin à mettre à jour dans le modpack",
      },
      { className: "normal-ok", label: "Mods normaux installés" },
      {
        className: "normal-update-available",
        label: "Mods normaux à mettre à jour dans le modpack",
      },
      {
        className: "normal-outdated",
        label: "Version local inégale à la version du modpack",
      },
      {
        className: "normal-outdated-and-update-available",
        label:
          "Version local inégale à la version du modpack et mise à jour disponible pour le modpack",
      },
      { className: "uninstalled", label: "Mods non installés" },
      {
        className: "uninprod",
        label: "Mods non présent dans le modpack mais installés",
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

    const statsTable = document.createElement("table");
    statsTable.classList.add("legend-stats-table");
    this.legendStatsTable = statsTable;

    legend.appendChild(statsTable);

    return legend;
  }

  getHash = async () => {
    const LocalHash = await ThunderstoreManager.getHash();
    const OnlineHash = (await VersionManager.getOnlineVersionConfig()).modpack
      .hash;

    const pluginLocalHash = LocalHash?.plugins || "?";
    const pluginOnlineHash = OnlineHash?.plugins || "?";
    const configLocalHash = LocalHash?.config || "?";
    const configOnlineHash = OnlineHash?.config || "?";

    return (this.hash = {
      pluginLocalHash,
      pluginOnlineHash,
      configLocalHash,
      configOnlineHash,
    });
  };

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

  updateLegendStatsTable() {
    if (!this.legendStatsTable) return;

    const { total, processed, updatesAvailable, errors } = this.stats;
    const percent = total ? Math.round((processed / total) * 100) : 0;

    this.legendStatsTable.innerHTML = `
      <tr><td>Mods traités</td><td>${processed} / ${total} (${percent}%)</td></tr>
      <tr><td>Mises à jour disponibles</td><td>${updatesAvailable}</td></tr>
      <tr><td>Erreurs</td><td>${errors}</td></tr>
    `;
  }
}

module.exports = GameTab;
