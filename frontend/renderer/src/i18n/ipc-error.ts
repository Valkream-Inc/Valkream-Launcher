/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Message d'une erreur reçue du main par IPC : Electron préfixe « Error invoking remote method 'x': Error: »,
 * le texte utile (déjà traduit par le main dans la langue du joueur) vient après.
 */

export const ipcErrorMessage = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error);
  return raw.replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, "");
};
