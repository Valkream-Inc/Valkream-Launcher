/**
 * @author Valkream Team
 * @license MIT-NC
 */

const axios = require("axios");

const SettingsManager = require("../../../manager/settingsManager");

const ValheimThunderstoreManager = require("../../../manager/Valheim/ValheimThunderstoreManager");
const ValheimVersionManager = require("../../../manager/Valheim/ValheimVersionManager");

class ValheimModsDataHandler {
  #getModId = (modName) => modName.split("-").slice(0, 2).join("-");
  #getModVersion = (modName) => modName.split("-").slice(2).join("-");

  async getModsData(signal) {
    const onlineInfo = await ValheimVersionManager.getOnlineVersionConfig();
    const localInfo = await ValheimVersionManager.getLocalVersionConfig();

    const onlineValkreamVersion = onlineInfo?.modpack?.version || "";
    const localValkreamVersion = localInfo?.modpack?.version || "";
    const onlineBepInExVersion = onlineInfo?.bepinex?.version || "";
    const localBepInExVersion = localInfo?.bepinex?.version || "";
    const adminMods = onlineInfo?.modpack?.admin_mods || [];

    const installedModsRaw =
      await ValheimThunderstoreManager.getInstalledMods();
    const installedMods = installedModsRaw.filter((m) => !m.endsWith(".dll"));

    let onlineMods = [];
    try {
      if (signal?.aborted) return;
      if (onlineValkreamVersion) {
        const res = await axios.get(
          `https://thunderstore.io/api/experimental/package/ValheimValkream/Valkream/${onlineValkreamVersion}/`
        );
        onlineMods = res.data?.dependencies || [];
      }

      if (await SettingsManager.getSetting("boostfpsModsEnabledWithValheim")) {
        onlineMods.push(...(onlineInfo?.modpack?.boostfps_mods || []));
      }
      if (
        await SettingsManager.getSetting("boostgraphicModsEnabledWithValheim")
      ) {
        onlineMods.push(...(onlineInfo?.modpack?.boostgraphic_mods || []));
      }
      if (await SettingsManager.getSetting("adminModsEnabledWithValheim")) {
        onlineMods.push(...(onlineInfo?.modpack?.admin_mods || []));
      }
    } catch (err) {
      console.error("Erreur récupération mods en ligne :", err);
    }

    const getTypeAndOnlineVersion = (mod) => {
      const modId = this.#getModId(mod);

      const isAdmin = adminMods.some(
        (admin) => this.#getModId(admin) === modId
      );
      const onlineMod = onlineMods.find((m) => this.#getModId(m) === modId);

      return {
        type: isAdmin ? "admin" : "normal",
        onlineVersion: isAdmin
          ? this.#getModVersion(
              adminMods.find((admin) => this.#getModId(admin) === modId) || mod
            )
          : onlineMod
          ? this.#getModVersion(onlineMod)
          : undefined,
      };
    };

    // Compose la liste finale
    const allMods = [
      // Mods spéciaux
      {
        mod: `ValheimValkream-Valkream-${localValkreamVersion}`,
        installed: true,
        type: "special",
        onlineVersion: onlineValkreamVersion,
      },
      {
        mod: `denikson-BepInExPack_Valheim-${localBepInExVersion}`,
        installed: true,
        type: "special",
        onlineVersion: onlineBepInExVersion,
      },
      // Mods installés
      ...installedMods.map((mod) => ({
        mod,
        installed: true,
        ...getTypeAndOnlineVersion(mod),
      })),
      // Mods en ligne non installés
      ...onlineMods
        .filter(
          (mod) => !installedMods.some((m) => m.startsWith(this.#getModId(mod)))
        )
        .map((mod) => ({
          mod,
          installed: false,
          ...getTypeAndOnlineVersion(mod),
        })),
    ].sort((a, b) => {
      const typeOrder = { special: 0, admin: 1, normal: 2 };
      const diff = typeOrder[a.type] - typeOrder[b.type];
      return diff !== 0
        ? diff
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

      const onlineMods = await ValheimVersionManager.getOnlineVersionConfig();
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

module.exports = new ValheimModsDataHandler();
