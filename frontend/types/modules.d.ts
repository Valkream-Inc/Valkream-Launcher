/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Déclarations minimales pour les dépendances sans types publiés.
 */

declare module "png2icons" {
  export const BILINEAR: number;
  export const HERMITE: number;
  export function createICNS(
    input: Buffer,
    scalingAlgorithm: number,
    numOfColors: number
  ): Buffer | null;
  export function createICO(
    input: Buffer,
    scalingAlgorithm: number,
    numOfColors: number,
    usePNG: boolean
  ): Buffer | null;
}

declare module "gamedig" {
  export interface GameDigQueryOptions {
    type: string;
    host: string;
    port?: number;
    timeout?: number;
  }

  export interface GameDigState {
    numplayers: number;
    maxplayers: number;
    ping: number;
  }

  export class GameDig {
    static query(options: GameDigQueryOptions): Promise<GameDigState>;
  }
}
