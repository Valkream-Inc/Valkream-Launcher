const axios = require("axios");

const SettingsManager = require("../../manager/settingsManager");
const ThunderstoreManager = require("../../manager/thunderstoreManager");
const VersionManager = require("../../manager/versionManager");

class ModsDataHandler {
  #getModId = (modName) => modName.split("-").slice(0, 2).join("-");
  #getModVersion = (modName) => modName.split("-").slice(2).join("-");

  async getModsData(signal) {
    const onlineValkreamInfo = await VersionManager.getOnlineVersionConfig();
    const localValkreamInfo = await VersionManager.getLocalVersionConfig();

    const onlineValkreamVersion = onlineValkreamInfo?.modpack?.version || "";
    const localValkreamVersion = localValkreamInfo?.modpack?.version || "";
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

      if (await SettingsManager.getSetting("boostfpsEnabled")) {
        const boostfpsMods = onlineValkreamInfo?.modpack?.boostfps_mods || [];
        onlineMods.push(...boostfpsMods);
      }
    } catch (err) {
      console.error("Erreur de récupération des dépendances en ligne :", err);
    }

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
        type: adminMods.some(
          (adminMod) => this.#getModId(adminMod) === this.#getModId(mod)
        )
          ? "admin"
          : "normal",
        onlineVersion: adminMods.some(
          (adminMod) => this.#getModId(adminMod) === this.#getModId(mod)
        )
          ? this.#getModVersion(
              adminMods.find(
                (adminMod) => this.#getModId(adminMod) === this.#getModId(mod)
              ) || mod
            )
          : undefined,
      })),
      ...onlineMods
        .filter(
          (mod) => !installedMods.some((m) => m.startsWith(this.#getModId(mod)))
        )
        .map((mod) => ({
          mod,
          installed: false,
          type: adminMods.some(
            (adminMod) => this.#getModId(adminMod) === this.#getModId(mod)
          )
            ? "admin"
            : "normal",
          onlineVersion: adminMods.some(
            (adminMod) => this.#getModId(adminMod) === this.#getModId(mod)
          )
            ? this.#getModVersion(
                adminMods.find(
                  (adminMod) => this.#getModId(adminMod) === this.#getModId(mod)
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

    return { mods: allMods };
  }

  async getModDetails(baseMod) {
    const { mod, installed, onlineVersion, type } = baseMod;
    try {
      const [author, name, version] = mod.split("-");

      const res = await axios.get(
        `https://thunderstore.io/api/experimental/package/${author}/${name}/`
      );
      const latest = res.data?.latest;

      const onlineMods = await VersionManager.getOnlineVersionConfig();
      const onlineMod = onlineMods?.modpack?.dependencies?.find((m) =>
        m.startsWith(`${author}-${name}-`)
      );

      return {
        name: `${author} - ${name}`,
        localVersion: installed ? version : null,
        onlineVersion: onlineVersion
          ? onlineVersion
          : installed
          ? onlineMod?.split("-")[2]
          : version,
        LastBuild: latest?.version_number,
        description: latest?.description,
        icon: latest?.icon,
        type,
        installed,
      };
    } catch (err) {
      console.warn(
        `Erreur lors du chargement des détails pour le mod ${mod}:`,
        err
      );
      return {
        name: mod,
        description: "Erreur de chargement",
        icon: null,
        error: true,
      };
    }
  }
}

module.exports = new ModsDataHandler();
