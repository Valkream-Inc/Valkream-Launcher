/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Téléchargement de texte (JSON, YAML) pour le `ParamResolver`.
 * Le texte reste brut : le parsing (JSON ou YAML) est fait par l'appelant.
 */

import { noCache } from "../../../core/constants.js";
import { httpGetText } from "../../../lib/net/http.js";

export const httpFetchText = (url: string): Promise<string> => httpGetText(url, { noCache, timeout: 5000 });
