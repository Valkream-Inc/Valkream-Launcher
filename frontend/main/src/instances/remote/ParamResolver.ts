/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Résout un paramètre remote (`LinkOrData`) : donnée inline, ou lien téléchargé
 * puis parsé. Garde la dernière valeur reçue (cache) pour rester utilisable
 * quand le serveur est injoignable.
 */

import yaml from "yaml";

import type { LinkOrData } from "@shared/types";

import { resolveLinkUrl } from "./link.js";
import { LocalizedError } from "../../lib/localized-error.js";

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

  getJson<T>(param: LinkOrData<T>): Promise<ResolvedParam<T>> {
    return this.load<T>(param, (text) => JSON.parse(text) as T);
  }

  getYaml<T>(link: string): Promise<ResolvedParam<T>> {
    return this.load<T>(link, (text) => yaml.parse(text) as T);
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
    parse: (text: string) => T,
  ): Promise<ResolvedParam<T>> {
    if (typeof param !== "string") {
      return { value: param, source: "inline" };
    }

    const url = this.urlOf(param);

    try {
      const text = await this.options.fetchText(url);
      const value = parse(text); // on ne met en cache que ce qui se parse
      await this.options.cache?.write(url, text).catch(() => undefined);
      return { value, source: "online", url };
    } catch (error) {
      const cached = await this.options.cache?.read(url).catch(() => null);
      if (cached != null) {
        try {
          return { value: parse(cached), source: "cache", url };
        } catch {
          // copie locale illisible : on remonte l'erreur d'origine
        }
      }
      throw error;
    }
  }
}
