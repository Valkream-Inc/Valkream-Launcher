/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Archives téléchargées pendant UNE synchronisation. Plusieurs entrées peuvent pointer vers la
 * même archive avec un `folder_in_zip` différent (un dossier du zip par dossier d'installation) :
 * elle n'est téléchargée qu'une fois, puis supprimée après sa dernière utilisation.
 */

import fs from "fs";

export class ArchiveCache {
  private readonly files = new Map<string, string>();

  /** `uses` : nombre d'entrées à traiter par lien d'archive (pour supprimer après la dernière). */
  constructor(private readonly uses: ReadonlyMap<string, number> = new Map()) {}

  get(link: string): string | undefined {
    const file = this.files.get(link);
    return file && fs.existsSync(file) ? file : undefined;
  }

  set(link: string, file: string): void {
    this.files.set(link, file);
  }

  /** Une entrée a fini avec cette archive : supprimée quand plus personne ne l'utilise. */
  release(link: string): void {
    const remaining = (this.uses.get(link) ?? 1) - 1;
    (this.uses as Map<string, number>).set(link, remaining);
    if (remaining <= 0) {
      const file = this.files.get(link);
      if (file) fs.rmSync(file, { force: true });
      this.files.delete(link);
    }
  }
}
