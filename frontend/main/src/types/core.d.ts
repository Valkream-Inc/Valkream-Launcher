/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Types internes au process main : constants, managers et ipc.
 * Les types partagés (Settings, GameEvent...) viennent de `@shared/types`.
 */

/** Champs de `package.json` utilisés par le main. */
export interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

/** Options de requête GameDig pour un serveur de jeu. */
export interface ServerQueryConfig {
  type: string;
  host: string;
  port: number;
  timeout: number;
}

/** Configuration des serveurs interrogés, par jeu. */
export interface ServersInfosConfig {
  Valheim: ServerQueryConfig;
  SevenDtoD: ServerQueryConfig;
}

/** Options axios pour désactiver le cache HTTP. */
export interface NoCacheConfig {
  headers: {
    "Cache-Control": string;
    Pragma: string;
    Expires: string;
  };
  params: {
    _t: number;
  };
}
