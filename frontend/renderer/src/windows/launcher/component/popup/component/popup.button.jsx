/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

export function createButtons(onClose, onConfirm) {
  if (!onConfirm) {
    return [{ text: "OK", action: onClose, variant: "main" }];
  }
  // Supporte soit un tableau [callback, texte], soit juste callback
  const confirmAction = Array.isArray(onConfirm) ? onConfirm[0] : onConfirm;
  const confirmText = (Array.isArray(onConfirm) && onConfirm[1]) || "OK";
  return [
    { text: confirmText, action: confirmAction, variant: "main" },
    { text: "Annuler", action: onClose, variant: "secondary" },
  ];
}
