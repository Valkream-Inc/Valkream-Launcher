/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * `empty` : entrée sans téléchargement. Ne touche à aucun fichier (ni nettoyage, ni écriture) ;
 * la version est simplement enregistrée comme installée.
 */

import type { Provider } from "./types.js";

export const emptyProvider: Provider = async () => ({});
