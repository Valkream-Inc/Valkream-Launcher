/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { LocalizedText } from "./instance.js";

/** Contenu de `games/<id>/config/event.json` (l'image est normalisée côté main). */
export interface GameEvent {
  /** Chaîne, ou `{ "fr": "…", "en": "…" }` (repli sur le français). */
  name: LocalizedText;
  enabled: boolean;
  date: string;
  description: LocalizedText;
  image: string;
  link: string;
}

/** Contenu de `games/<id>/config/maintenance.json`. */
export interface Maintenance {
  enabled: boolean;
  description: LocalizedText;
  end_date: string;
}

export interface ServerOnlineInfos {
  status: "server online";
  players: { online: number; max: number };
  ping: number;
}

export interface ServerOfflineInfos {
  status: "server offline";
}

export type ServerInfos = ServerOnlineInfos | ServerOfflineInfos;

/** Réponse de `electron_API.getInstanceInfos(id)`. `false` si indisponible. */
export interface CheckInfosResult {
  serverInfos: ServerInfos;
  event: GameEvent | false;
  maintenance: Maintenance | false;
}
