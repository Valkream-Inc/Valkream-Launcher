/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { GameName } from "@shared/types";

import { baseUrl } from "../constants";

class LinksManager {
  maintenanceUrl = (game: GameName): string => `${baseUrl}/configs/${game}/maintenance.json`;
  eventUrl = (game: GameName): string => `${baseUrl}/configs/${game}/event.json`;
}

export default new LinksManager();
