/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { Channel, InstanceId, InstanceSettingValue } from "@shared/types";

/** Réglages d'une installation (instance + canal), enregistrés côté main. */
export type InstanceSettingValues = Record<string, InstanceSettingValue>;

/** Props communes aux réglages d'une instance. */
export interface InstanceSettingProps {
  id: InstanceId;
  channel: Channel;
  values: InstanceSettingValues;
  /** Appelé avec les réglages à jour après une sauvegarde. */
  onChange: (
    values: InstanceSettingValues | ((previous: InstanceSettingValues) => InstanceSettingValues),
  ) => void;
}

/** Props des boutons d'action sur l'installation. */
export interface InstanceButtonProps {
  id: InstanceId;
  channel: Channel;
  /** Appelé après une action qui modifie l'installation. */
  onDone?: () => void;
}
