/**
 * @author Valkream Team
 * @license MIT-NC
 */

import dns from "dns";

import type { ServerInfos } from "@shared/types";

import { baseUrl, noCache } from "./constants.js";
import { httpGet } from "../lib/net/http.js";
import type { ServerQueryConfig } from "../types/core.js";

/** Durée pendant laquelle un « serveur joignable » est réutilisé. Un échec n'est JAMAIS mémorisé : la reconnexion est vue au tour suivant. */
const REACHABLE_TTL_MS = 15_000;

class InfosManager {
  isServerReachable: boolean | null = null;
  isInternetConnected: boolean | null = null;
  private reachableAt = 0;
  private reachableCheck: Promise<boolean> | null = null;

  async getIsInternetConnected(hostname = "google.com"): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Toute erreur de résolution (ENOTFOUND, EAI_AGAIN…) = pas de connexion
      dns.lookup(hostname, (err) => {
        this.isInternetConnected = !err;
        resolve(!err);
      });
    });
  }

  /** `force` : ignore le résultat récent (utile juste avant une action réseau). */
  async getIsServerReachable(url = baseUrl, force = false): Promise<boolean> {
    if (!force && this.isServerReachable === true && Date.now() - this.reachableAt < REACHABLE_TTL_MS)
      return true;
    if (this.reachableCheck) return this.reachableCheck; // une seule vérification à la fois

    this.reachableCheck = (async () => {
      try {
        await httpGet(url, { timeout: 3000, noCache });
        this.isServerReachable = true;
        this.reachableAt = Date.now();
        return true;
      } catch (error) {
        console.error(
          "Error checking server reachability:",
          error instanceof Error ? error.message : String(error)
        );
        this.isServerReachable = false;
        return false;
      } finally {
        this.reachableCheck = null;
      }
    })();
    return this.reachableCheck;
  }

  /** Interroge le serveur de jeu (GameDig). Ne lève jamais : « server offline » en cas d'échec. */
  async getServerInfos(server: ServerQueryConfig): Promise<ServerInfos> {
    try {
      // Chargé à la demande : gamedig est lourd et n'est utile qu'à la première requête serveur
      const { GameDig } = await import("gamedig");
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
