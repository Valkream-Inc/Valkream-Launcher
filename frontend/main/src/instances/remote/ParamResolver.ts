/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Résout un paramètre remote (`LinkOrData`) : donnée inline, ou lien téléchargé
 * puis parsé. Garde la dernière valeur reçue (cache) pour rester utilisable
 * quand le serveur est injoignable.
 */

import type { LinkOrData } from "@shared/types";

import { resolveLinkUrl } from "./link.js";
import { LocalizedError } from "../../lib/errors/localized-error.js";
import { parseData } from "../../lib/format/parse-data.js";
import { resolveVariants, type VariantContext } from "./variants.js";

export interface ParamCache {
  read(key: string): Promise<string | null>;
  write(key: string, content: string): Promise<void>;
}

export interface ParamResolverOptions {
  /** Racine du serveur de fichiers, pour les liens `/chemin`. */
  baseUrl: string;
  /** Télécharge un texte. Injectable pour les tests. */
  fetchText: (url: string) => Promise<string>;
  cache?: ParamCache;
  /** Accepte `http://` (développement local). Faux par défaut : HTTPS obligatoire. */
  allowInsecure?: boolean;
}

export type ParamSource = "inline" | "online" | "cache";

export interface ResolvedParam<T> {
  value: T;
  source: ParamSource;
  /** URL réellement utilisée (absente pour une donnée inline). */
  url?: string;
}

export class ParamResolver {
  constructor(private readonly options: ParamResolverOptions) {}

  /**
   * Lit un paramètre (donnée inline ou lien). Le format (YAML ou JSON) est détecté par l'extension du lien.
   * Avec `context`, chaque valeur déclinée par canal / plateforme / langue est remplacée par celle qui s'applique
   * (voir variants.ts) : le fichier brut reste en cache, la langue peut donc changer sans retélécharger.
   */
  async get<T>(param: LinkOrData<T>, context?: VariantContext): Promise<ResolvedParam<T>> {
    const loaded = await this.load<T>(param, (text) => parseData(text, typeof param === "string" ? param : ""));
    return context === undefined ? loaded : { ...loaded, value: resolveVariants(loaded.value, context) as T };
  }

  /** Alias de `get` (le format ne dépend plus de la méthode, seulement de l'extension). */
  getJson<T>(param: LinkOrData<T>, context?: VariantContext): Promise<ResolvedParam<T>> {
    return this.get<T>(param, context);
  }

  getYaml<T>(link: string, context?: VariantContext): Promise<ResolvedParam<T>> {
    return this.get<T>(link, context);
  }

  /** URL absolue d'un lien, avec la règle HTTPS. Lève si le lien est invalide. */
  urlOf(link: string): string {
    const url = resolveLinkUrl(link, this.options.baseUrl);
    if (!this.options.allowInsecure && !/^https:\/\//i.test(url)) {
      throw new LocalizedError("err.httpsRequired", { url });
    }
    return url;
  }

  private async load<T>(
    param: LinkOrData<T>,
    parse: (text: string) => Promise<unknown>,
  ): Promise<ResolvedParam<T>> {
    if (typeof param !== "string") {
      return { value: param, source: "inline" };
    }

    const url = this.urlOf(param);

    try {
      const text = await this.options.fetchText(url);
      const value = (await parse(text)) as T; // on ne met en cache que ce qui se parse
      await this.options.cache?.write(url, text).catch(() => undefined);
      return { value, source: "online", url };
    } catch (error) {
      const cached = await this.options.cache?.read(url).catch(() => null);
      if (cached != null) {
        try {
          return { value: (await parse(cached)) as T, source: "cache", url };
        } catch {
          // copie locale illisible : on remonte l'erreur d'origine
        }
      }
      throw error;
    }
  }
}
