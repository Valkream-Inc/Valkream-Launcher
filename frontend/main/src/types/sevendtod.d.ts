/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types internes au process main pour SevenDtoD.
 */

/** Callback de progression dont seuls le texte (et éventuellement le reste) est fourni. */
export type SevenDtoDLooseProgressCallback = (
  text: string,
  processedBytes?: number,
  totalBytes?: number,
  percent?: number,
  speed?: number
) => void;

/** Callback n'acceptant qu'un texte (ex : génération du fix). */
export type SevenDtoDTextCallback = (text: string) => void;

/** Fichier déplacé/renommé entre deux inventaires de hashs. */
export interface SevenDtoDMovedFile {
  oldPath: string;
  newPath: string;
  hash: string;
}

/** Contenu du fichier `to_delete_into_server.fix`. */
export interface SevenDtoDModsFixData {
  generatedAt: string;
  stats: {
    toUpload: number;
    toDelete: number;
    moved: number;
  };
  delete: string[];
}
