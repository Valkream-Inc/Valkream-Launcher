/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { Channel, InstanceId, InstanceReport } from "@shared/types";

export interface ReloadOptions {
  /** Vérifie aussi le contenu des fichiers (hash). */
  verify?: boolean;
  /** Rechargement discret : ni indicateur de chargement, ni effacement d'erreur (évite le clignotement). */
  silent?: boolean;
}

interface ReportState {
  report: InstanceReport | null;
  loading: boolean;
  error: string | null;
  reload: (options?: ReloadOptions | boolean) => Promise<void>;
}

/** Charge le rapport d'une installation (instance + canal) et permet de le recharger. */
export const useInstanceReport = (id: InstanceId, channel: Channel): ReportState => {
  const [report, setReport] = useState<InstanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Seule la réponse du dernier appel est prise en compte (les anciennes arrivent parfois après)
  const lastRequest = useRef(0);

  const reload = useCallback(
    async (options: ReloadOptions | boolean = {}) => {
      const { verify = false, silent = false } = typeof options === "boolean" ? { verify: options } : options;
      const request = ++lastRequest.current;
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const next = await window.electron_API.getInstanceReport(id, channel, { verify });
        if (request === lastRequest.current) {
          setReport(next);
          setError(null);
        }
      } catch (e) {
        if (request === lastRequest.current) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (request === lastRequest.current) setLoading(false);
      }
    },
    [id, channel],
  );

  // Changement d'instance ou de canal : on repart d'un état vide
  useEffect(() => {
    setReport(null);
    void reload();
  }, [reload]);

  return { report, loading, error, reload };
};
