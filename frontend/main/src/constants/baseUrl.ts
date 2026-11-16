/**
 * @author Valkream Team
 * @license MIT-NC
 */

import isDev from "./isDev";

const baseUrl = isDev ? "http://localhost:3000" : "https://play.valkream.com";

export default baseUrl;
