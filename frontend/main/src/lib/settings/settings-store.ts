/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Réglages du launcher dans un simple fichier JSON (`settings.json`), écrit de façon atomique
 * (fichier temporaire puis renommage : une coupure ne laisse jamais un fichier à moitié écrit).
 * Un fichier illisible est mis de côté (`.corrupt`) et remplacé par les valeurs par défaut.
 */

import fs from "fs";
import path from "path";

export class SettingsStore<T extends object> {
  private data: T;

  constructor(
    private readonly file: string,
    private readonly defaults: T,
    /** Valeur acceptable pour cette clé ? Sinon la valeur par défaut est conservée (fichier modifié à la main, ancienne version). */
    private readonly isValid: (key: keyof T, value: unknown) => boolean = () => true,
  ) {
    this.data = { ...defaults };
  }

  init(): void {
    if (fs.existsSync(this.file)) {
      try {
        const parsed: unknown = JSON.parse(fs.readFileSync(this.file, "utf8"));
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) throw new Error("objet attendu");
        // Réglage absent (ancienne version du launcher) : valeur par défaut
        const data = { ...this.defaults };
        for (const key of Object.keys(this.defaults) as (keyof T)[]) {
          const value = (parsed as Partial<T>)[key];
          if (value !== undefined && this.isValid(key, value)) data[key] = value as T[keyof T];
        }
        this.data = data;
        return;
      } catch {
        fs.renameSync(this.file, `${this.file}.corrupt`);
      }
    }
    this.data = { ...this.defaults };
    this.save();
  }

  get<K extends keyof T>(key: K): T[K] {
    return this.data[key];
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    if (!this.isValid(key, value)) throw new Error(`Invalid value for setting "${String(key)}".`);
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
