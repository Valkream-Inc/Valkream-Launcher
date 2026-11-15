/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { baseUrl } from "../constants";

const toValidUrl = (url: string): string => {
  if (typeof url !== "string") throw new Error("URL must be a string");
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  } else {
    // S'assurer qu'il n'y a pas de double slash
    return baseUrl.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
};

export default toValidUrl;
