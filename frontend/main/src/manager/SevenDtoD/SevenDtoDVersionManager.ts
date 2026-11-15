/**
 * @author Valkream Team
 * @license MIT-NC
 */

import axios from "axios";
import fs from "fs/promises";
import yaml from "yaml";
import type { SevenDtoDVersionConfig } from "@shared/types";

import ValheimFilesManager from "./SevenDtoDFilesManager";
import ValheimLinksManager from "./SevenDtoDLinksManager";
import InfosManager from "../infosManager";
import noCache from "../../constants/noCaheHeader";

class SevenDtoDVersionManager {
  onlineVersionConfig: SevenDtoDVersionConfig | null;
  localVersionConfig: SevenDtoDVersionConfig | null;
  gameVersionFileLink!: string;
  gameVersionFilePath!: string;

  constructor() {
    this.onlineVersionConfig = null;
    this.localVersionConfig = null;
  }

  async init(): Promise<void> {
    this.gameVersionFileLink = await ValheimLinksManager.gameVersionUrl();
    this.gameVersionFilePath = ValheimFilesManager.gameVersionFilePath();
  }

  async getOnlineVersionConfig(
    force = false
  ): Promise<SevenDtoDVersionConfig | null> {
    await this.init();
    if (!force && this.onlineVersionConfig) return this.onlineVersionConfig;

    if (await InfosManager.getIsServerReachable()) {
      const { data } = await axios.get<string>(this.gameVersionFileLink, noCache);
      this.onlineVersionConfig = yaml.parse(data.trim());
    }

    return this.onlineVersionConfig;
  }

  async getLocalVersionConfig(
    force = false
  ): Promise<SevenDtoDVersionConfig | null> {
    await this.init();
    if (!force && this.localVersionConfig) return this.localVersionConfig;

    try {
      const content = await fs.readFile(this.gameVersionFilePath, "utf8");
      this.localVersionConfig = yaml.parse(content.trim());
      return this.localVersionConfig;
    } catch {
      return null;
    }
  }

  async isUpToDate(): Promise<boolean> {
    await this.init();
    const [local, online] = await Promise.all([
      this.getLocalVersionConfig(),
      this.getOnlineVersionConfig(),
    ]);
    return !!(
      local?.version &&
      online?.version &&
      local.version === online.version
    );
  }

  async isMajorUpdate(): Promise<boolean> {
    const [local, online] = await Promise.all([
      this.getLocalVersionConfig(),
      this.getOnlineVersionConfig(),
    ]);

    const majorLocal = (local?.version ?? "0.0.0").split(".")[0];
    const majorOnline = (online?.version ?? "0.0.0").split(".")[0];
    return majorLocal !== majorOnline;
  }

  async getLocalVersion(): Promise<string | null | undefined> {
    const [local] = await Promise.all([this.getLocalVersionConfig()]);
    return this.getIsInstalled() ? local?.version : "0.0.0";
  }

  async updateLocalVersionConfig(
    content?: SevenDtoDVersionConfig | null
  ): Promise<void> {
    await this.init();
    const dataToWrite = content || (await this.getOnlineVersionConfig());
    this.localVersionConfig = dataToWrite;
    await fs.writeFile(this.gameVersionFilePath, yaml.stringify(dataToWrite));
  }

  async getIsInstalled(): Promise<boolean> {
    await this.init();
    try {
      await fs.access(this.gameVersionFilePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default new SevenDtoDVersionManager();
