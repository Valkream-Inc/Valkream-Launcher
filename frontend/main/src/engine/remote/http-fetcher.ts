/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Téléchargement de texte (JSON, YAML) pour le `ParamResolver`.
 */

import axios from "axios";

import noCache from "../../constants/noCaheHeader";

export const httpFetchText = async (url: string): Promise<string> => {
  const response = await axios.get<string>(url, {
    ...noCache,
    timeout: 5000,
    responseType: "text",
    // On garde le texte brut : le parsing (JSON ou YAML) est fait par l'appelant.
    transformResponse: (data: string) => data,
  });
  return response.data;
};
