/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { CheckInfosResult, GameName } from "@shared/types";

import InfosManager from "../../manager/infosManager";

async function CheckInfos(game: GameName): Promise<CheckInfosResult> {
  const [serverInfos, event, maintenance] = await Promise.all([
    InfosManager.getServerInfos(game),
    InfosManager.getEvent(game),
    InfosManager.getMaintenance(game),
  ]);

  return {
    serverInfos,
    event,
    maintenance,
  };
}

export default CheckInfos;
