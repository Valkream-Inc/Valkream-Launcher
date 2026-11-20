/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
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
  onChange({ ...values, [name]: value });
  try {
    onChange(
      await window.electron_API.setInstanceSetting(id, channel, name, value)
    );
    if (message) enqueueSnackbar(message, { variant: "info" });
  } catch (error) {
    console.error(error);
    onChange(values);
    enqueueSnackbar("Réglage non enregistré !", { variant: "error" });
  }
};
