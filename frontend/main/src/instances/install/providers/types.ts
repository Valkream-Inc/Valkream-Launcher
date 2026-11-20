/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Contrat d'un provider : sait installer UN type d'entrée du latest.yml.
 * Les accès réseau et zip sont injectés (`InstallIO`) pour tester sans réseau.
 */

import type { GamePlatform, ProgressData, ReleaseEntry } from "@shared/types";

import type { ParamResolver } from "../../remote/ParamResolver";
import type { HashCache } from "../hash-cache";
import type { UpdatePlan } from "../preserve";

/** Progression d'un téléchargement : valeurs déjà formatées pour l'affichage. */
export type TransferProgress = Pick<ProgressData, "processedBytes" | "totalBytes" | "percent" | "speed">;

export interface InstallIO {
  /** Télécharge `url` vers `destination` (crée les dossiers parents). */
  download(
    url: string,
    destination: string,
    signal?: AbortSignal,
    onProgress?: (progress: TransferProgress) => void,
  ): Promise<void>;
  /**
   * Extrait `zipPath` dans `outDir`. `folderInZip` limite l'extraction à ce dossier de
   * l'archive (son contenu arrive à la racine de `outDir`). `accept` reçoit le chemin
   * relatif à `outDir` de chaque fichier : faux = non écrit.
   */
  extract(
    zipPath: string,
    outDir: string,
    options: {
      folderInZip?: string;
      accept: (relativePath: string) => boolean;
      /** Progression de l'extraction (octets décompressés). */
      onProgress?: (progress: TransferProgress) => void;
    },
  ): Promise<void>;
  /**
   * Installation en flux d'une archive `.tar.gz` : décompression et écriture PENDANT le
   * téléchargement, sans archive intermédiaire sur le disque. Pas de reprise : en cas de
   * coupure réseau, l'extraction recommence depuis le début. La progression suit les octets reçus.
   */
  streamExtract(
    url: string,
    outDir: string,
    options: { folderInZip?: string; accept: (relativePath: string) => boolean },
    signal?: AbortSignal,
    onProgress?: (progress: TransferProgress) => void,
  ): Promise<void>;
}

export interface ProviderContext {
  name: string;
  entry: ReleaseEntry;
  /** Dossier de l'entrée (`installDir/path`), déjà validé par la liste blanche. */
  entryDir: string;
  /** Dossier temporaire de cette synchronisation. */
  tempDir: string;
  plan: UpdatePlan;
  platform: GamePlatform;
  resolver: ParamResolver;
  io: InstallIO;
  /** Cache des hash de fichiers de l'installation. */
  hashes: HashCache;
  /** Dossiers possédés enregistrés lors de la précédente installation de l'entrée. */
  previousOwned: string[];
  signal?: AbortSignal;
  /**
   * À appeler une fois TOUT téléchargé et prêt, juste avant de basculer dans `entryDir` :
   * retire les dossiers `gameFolderToRemove`. Jusque-là, l'installation n'est pas touchée.
   */
  beforeCommit: () => void;
  report: (step: "download" | "extract" | "verify", message: string, transfer?: TransferProgress) => void;
}

export interface ProviderResult {
  /** Hash à enregistrer (celui du remote quand il est déclaré). */
  hash?: string;
  owned?: string[];
}

export type Provider = (context: ProviderContext) => Promise<ProviderResult>;

/** Retire ce qu'une entrée a installé (entrée optionnelle désactivée). Absent = rien à retirer sur le disque. */
export type Uninstaller = (context: Pick<ProviderContext, "entryDir" | "previousOwned">) => Promise<void>;
