/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ValheimBaseMod, ValheimModDetails } from "@shared/types";

export interface ValheimModsTabProps {
  isDevActive: boolean;
}

/** Mod de la liste, enrichi des détails une fois chargés (ou marqué en erreur). */
export type ValheimModEntry = ValheimBaseMod & Partial<ValheimModDetails>;
