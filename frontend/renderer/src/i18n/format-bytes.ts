/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Taille lisible dans la langue courante (o / Ko / Mo / Go ou B / KB / MB / GB).
 */

import i18n from "./index";

export const formatBytes = (bytes: number): string => {
  const units = [
    i18n.t("tools.units.b"),
    i18n.t("tools.units.kb"),
    i18n.t("tools.units.mb"),
    i18n.t("tools.units.gb"),
  ];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) ((value /= 1024), unit++);
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};
