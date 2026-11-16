/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ServersInfosConfig } from "../types/core";

const serversInfos: ServersInfosConfig = {
  Valheim: {
    type: "valheim",
    host: "51.222.46.122",
    port: 2457,
    timeout: 2000,
  },
  SevenDtoD: {
    type: "sdtd",
    host: "7days.valkream.com",
    port: 26900,
    timeout: 2000,
  },
};

export default serversInfos;
