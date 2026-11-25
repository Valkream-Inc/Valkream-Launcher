/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import i18n from "../../../../../../i18n";
import type { InstanceSettingValue } from "@shared/types";

import type { InstanceSettingProps } from "./instance-setting.types";

/**
 * Enregistre un réglage de l'installation et prévient le parent.
 * Mise à jour optimiste : l'interface change tout de suite (pas de clignotement),
 * puis on aligne sur la valeur confirmée par le main, ou on annule en cas d'échec.
 */
export const saveInstanceSetting = async (
  { id, channel, values, onChange }: InstanceSettingProps,
  name: string,
  value: InstanceSettingValue,
  message?: string
): Promise<void> => {
  const before = values[name];
  // Mises à jour fonctionnelles : plusieurs changements rapprochés ne s'écrasent pas (pas de valeurs périmées)
  onChange((previous) => ({ ...previous, [name]: value }));
  try {
    const saved = await window.electron_API.setInstanceSetting(id, channel, name, value);
    // Seule la clé enregistrée est alignée sur le main : les autres changements en cours restent intacts
    onChange((previous) => ({ ...previous, [name]: saved[name] ?? value }));
    if (message) enqueueSnackbar(message, { variant: "info" });
  } catch (error) {
    console.error(error);
    onChange((previous) => {
      const { [name]: _discarded, ...rest } = previous;
      return before === undefined ? rest : { ...rest, [name]: before };
    });
    enqueueSnackbar(i18n.t("instance.saveFailed"), { variant: "error" });
  }
};
