/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useCallback, useEffect, useState } from "react";

import type { Channel, InstanceId, InstanceReport } from "@shared/types";

interface ReportState {
  report: InstanceReport | null;
  loading: boolean;
  error: string | null;
  reload: (verify?: boolean) => Promise<void>;
}

/** Charge le rapport d'une installation (instance + canal) et permet de le recharger. */
export const useInstanceReport = (id: InstanceId, channel: Channel): ReportState => {
  const [report, setReport] = useState<InstanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (verify = false) => {
      setLoading(true);
      setError(null);
      try {
        setReport(await window.electron_API.getInstanceReport(id, channel, { verify }));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [id, channel],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { report, loading, error, reload };
};
