/**
 * @author Valkream Team
 * @license MIT-NC
 */

import axios from "axios";
import type { ProgressCallback, SevenDtoDHashMap } from "@shared/types";
import { hashFolderWithArborescence } from "../../utils/function/hashFolderWithArborescence";

import InfosManager from "../infosManager";
import SevenDtoDDirsManager from "./SevenDtoDDirsManager";
import SevenDtoDLinksManager from "./SevenDtoDLinksManager";
import noCache from "../../constants/noCaheHeader";

class SevenDtoDHashManager {
  localHash: SevenDtoDHashMap | null;
  onlineHash: SevenDtoDHashMap | null;
  modsPath!: string;

  constructor() {
    this.localHash = null;
    this.onlineHash = null;
  }

  init(): void {
    this.modsPath = SevenDtoDDirsManager.modsPath();
  }

  async getLocalHash(
    force = false,
    callback: ProgressCallback = () => {}
  ): Promise<SevenDtoDHashMap> {
    this.init();
    if (!force && this.localHash !== null) return this.localHash;
    const hash: SevenDtoDHashMap =
      (await hashFolderWithArborescence(this.modsPath, callback)) || {};
    this.localHash = hash;
    return hash;
  }

  async getOnlineHash(force = false): Promise<SevenDtoDHashMap> {
    if (!force && this.onlineHash !== null) return this.onlineHash;
    if (await InfosManager.getIsServerReachable()) {
      const { data } = await axios.get<SevenDtoDHashMap>(
        await SevenDtoDLinksManager.modHashLink(),
        noCache,
      );
      this.onlineHash = data;
    }

    return this.onlineHash || {};
  }

  async getIsInstalled(): Promise<boolean> {
    try {
      const localHash = await this.getLocalHash();
      return localHash && Object.keys(localHash).length > 0;
    } catch {
      return false;
    }
  }

  async getIsUpToDate(): Promise<boolean> {
    const [local, online] = await Promise.all([
      this.getLocalHash(),
      this.getOnlineHash(),
    ]);

    // Fonction de comparaison profonde des objets
    function deepEqual(
      obj1: Record<string, unknown>,
      obj2: Record<string, unknown>
    ): boolean {
      const k1 = Object.keys(obj1).sort();
      const k2 = Object.keys(obj2).sort();
      if (k1.length !== k2.length) return false;
      for (let i = 0; i < k1.length; i++) {
        if (k1[i] !== k2[i]) return false;

        const val1 = obj1[k1[i]];
        const val2 = obj2[k2[i]];

        if (typeof val1 === "object" && val1 !== null) {
          if (
            !deepEqual(
              val1 as Record<string, unknown>,
              val2 as Record<string, unknown>
            )
          )
            return false;
        } else if (val1 !== val2) {
          return false;
        }
      }
      return true;
    }

    return deepEqual(local, online);
  }
}

export default new SevenDtoDHashManager();
