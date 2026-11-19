/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import type { InstanceSettingValue } from "@shared/types";

import type { InstanceSettingProps } from "./instance-setting.types";

/** Enregistre un réglage de l'installation et prévient le parent. */
export const saveInstanceSetting = async (
  { id, channel, onChange }: InstanceSettingProps,
  name: string,
  value: InstanceSettingValue,
  message?: string
): Promise<void> => {
  try {
    onChange(
      await window.electron_API.setInstanceSetting(id, channel, name, value)
    );
    if (message) enqueueSnackbar(message, { variant: "info" });
  } catch (error) {
    console.error(error);
    enqueueSnackbar("Réglage non enregistré !", { variant: "error" });
  }
};
