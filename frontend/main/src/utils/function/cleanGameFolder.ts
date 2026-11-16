/**
 * @author Valkream Team
 * @license MIT-NC
 */

import fs from "fs";
import path from "path";

const cleanGameFolder = (
  ValheimValkreamDataPath: string,
  foldersToClean: string[]
): void => {
  for (const folderToClean of foldersToClean) {
    const folderToCleanPath = path.join(ValheimValkreamDataPath, folderToClean);

    if (fs.existsSync(folderToCleanPath)) {
      fs.rmSync(folderToCleanPath, { recursive: true });
    }
  }
};

export { cleanGameFolder };
