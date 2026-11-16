/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import { platform } from "os";

import type { PlatformValues } from "../types/utils";

const newDir = (valueForAllPlatforms: PlatformValues): string => {
  const dirPath = valueForAllPlatforms[platform() as keyof PlatformValues];

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.error(
      "Erreur lors de la création du dossier:",
      err instanceof Error ? err.message : String(err)
    );
  }

  return dirPath; // toujours un string
};

export default newDir;
