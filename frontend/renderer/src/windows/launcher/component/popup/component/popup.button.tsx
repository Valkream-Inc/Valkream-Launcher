/**
 * @author Valkream Team
 * @license MIT-NC
 */

import i18n from "../../../../../i18n";
import type { PopupButton, PopupConfirm } from "../popup.types";

export function createButtons(
  onClose: () => void,
  onConfirm?: PopupConfirm
): PopupButton[] {
  if (!onConfirm) {
    return [{ text: "OK", action: onClose, variant: "main" }];
  }
  // Supporte soit un tableau [callback, texte], soit juste callback
  const confirmAction = Array.isArray(onConfirm) ? onConfirm[0] : onConfirm;
  const confirmText = (Array.isArray(onConfirm) && onConfirm[1]) || "OK";
  return [
    { text: confirmText, action: confirmAction, variant: "main" },
    { text: i18n.t("common.cancel"), action: onClose, variant: "secondary" },
  ];
}
