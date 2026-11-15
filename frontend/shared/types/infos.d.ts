/**
 * @author Valkream Team
 * @license MIT-NC
 */

/** Contenu de `configs/<jeu>/event.json` (l'image est normalisée côté main). */
export interface GameEvent {
  name: string;
  enabled: boolean;
  date: string;
  description: string;
  image: string;
  link: string;
}

/** Contenu de `configs/<jeu>/maintenance.json`. */
export interface Maintenance {
  enabled: boolean;
  description: string;
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

/** Réponse de `electron_API.getInfos(game)`. `false` si indisponible. */
export interface CheckInfosResult {
  serverInfos: ServerInfos;
  event: GameEvent | false;
  maintenance: Maintenance | false;
}
