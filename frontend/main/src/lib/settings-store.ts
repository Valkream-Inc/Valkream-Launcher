/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Réglages du launcher dans un simple fichier JSON (`settings.json`), écrit de façon atomique
 * (fichier temporaire puis renommage : une coupure ne laisse jamais un fichier à moitié écrit).
 * Un fichier illisible est mis de côté (`.corrupt`) et remplacé par les valeurs par défaut.
 * Au premier lancement, les réglages de l'ancienne base SQLite sont repris (`legacy`).
 */

import fs from "fs";
import path from "path";

export class SettingsStore<T extends object> {
  private data: T;

  constructor(
    private readonly file: string,
    private readonly defaults: T,
    /** Réglages à reprendre quand le fichier n'existe pas encore (ancienne base). */
    private readonly legacy?: () => Promise<Partial<T> | undefined>,
  ) {
    this.data = { ...defaults };
  }

  async init(): Promise<void> {
    if (fs.existsSync(this.file)) {
      try {
        const parsed: unknown = JSON.parse(fs.readFileSync(this.file, "utf8"));
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("objet attendu");
        // Réglage absent (ancienne version du launcher) : valeur par défaut
        this.data = { ...this.defaults, ...(parsed as Partial<T>) };
        return;
      } catch {
        fs.renameSync(this.file, `${this.file}.corrupt`);
      }
    }
    let imported: Partial<T> | undefined;
    try {
      imported = await this.legacy?.();
    } catch {
      imported = undefined; // migration facultative : jamais bloquante
    }
    this.data = { ...this.defaults, ...(imported ?? {}) };
    this.save();
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data = { ...this.data, [key]: value };
    this.save();
  }

  private save(): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temporary = `${this.file}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(this.data, null, 2));
    fs.renameSync(temporary, this.file);
  }
}
