/**
 * @author Valkream Team
 * @license MIT-NC
 */

import axios from "axios";
import dns from "dns";
import { GameDig } from "gamedig";

import type {
  GameEvent,
  GameName,
  Maintenance,
  ServerInfos,
} from "@shared/types";

import { baseUrl, serversInfos } from "../constants";
import LinksManager from "./linksManager";
import noCache from "../constants/noCaheHeader";
import { toValidUrl } from "../utils";

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

  async getEvent(game: GameName): Promise<GameEvent | false> {
    try {
      if (!(await this.getIsServerReachable())) return false;
      const res = await axios.get<GameEvent>(LinksManager.eventUrl(game), {
        timeout: 3000,
        ...noCache,
      });
      return {
        ...res.data,
        image: res.data.image.startsWith("data:")
          ? res.data.image
          : toValidUrl(res.data.image),
      };
    } catch (err) {
      console.error(
        "Error getting Event:",
        err instanceof Error ? err.message : String(err)
      );
      return false;
    }
  }

  async getMaintenance(game: GameName): Promise<Maintenance | false> {
    try {
      if (!(await this.getIsServerReachable())) return false;
      const res = await axios.get<Maintenance>(LinksManager.maintenanceUrl(game), {
        timeout: 3000,
        ...noCache,
      });
      return res.data;
    } catch (err) {
      console.error(
        "Error getting Maintenance:",
        err instanceof Error ? err.message : String(err)
      );
      return false;
    }
  }

  async getServerInfos(game: GameName): Promise<ServerInfos> {
    try {
      const res = await GameDig.query(serversInfos[game]);

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
