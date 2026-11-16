/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { ValheimModType } from "@shared/types";

export interface ModCardProps {
  isDevActive?: boolean;
  type?: ValheimModType | null;
  localVersion?: string | null;
  onlineVersion?: string;
  LastBuild?: string;
  installed?: boolean;
  name?: string;
  description?: string;
  icon?: string | null;
}
