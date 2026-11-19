/**
 * @author Valkream Team
 * @license MIT-NC
 */

import axios from "axios";
import dns from "dns";
import { GameDig } from "gamedig";

import type { ServerInfos } from "@shared/types";

import { baseUrl } from "../constants/index";
import noCache from "../constants/noCaheHeader";
import type { ServerQueryConfig } from "../types/core";

class InfosManager {
  isServerReachable: boolean | null;
  isInternetConnected: boolean | null;

  constructor() {
    this.isServerReachable = null;
    this.isInternetConnected = null;
  }

  async getIsInternetConnected(
    hostname = "google.com",
    force = false
  ): Promise<boolean> {
    if (!force && this.isInternetConnected !== null)
      return this.isInternetConnected;

    return new Promise<boolean>((resolve) => {
      dns.lookup(hostname, (err) => {
        resolve(!(err && err.code === "ENOTFOUND"));
      });
    });
  }

  async getIsServerReachable(url = baseUrl, force = false): Promise<boolean> {
    if (!force && this.isServerReachable !== null)
      return this.isServerReachable;

    try {
      await axios.get(url, { timeout: 3000, ...noCache });
      this.isServerReachable = true;
      return true;
    } catch (error) {
      console.error(
        "Error checking server reachability:",
        error instanceof Error ? error.message : String(error)
      );
      this.isServerReachable = false;
      return false;
    }
  }

  /** Interroge le serveur de jeu (GameDig). Ne lève jamais : « server offline » en cas d'échec. */
  async getServerInfos(server: ServerQueryConfig): Promise<ServerInfos> {
    try {
      const res = await GameDig.query(server);

      return {
        status: "server online",
        players: {
          online: res.numplayers,
          max: res.maxplayers,
        },
        ping: res.ping,
      };
    } catch (err) {
      console.error(
        "Error getting server infos:",
        err instanceof Error ? err.message : String(err)
      );
      return { status: "server offline" };
    }
  }
}

export default new InfosManager();
