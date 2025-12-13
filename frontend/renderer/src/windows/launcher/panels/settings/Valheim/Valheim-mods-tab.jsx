/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, {
  forwardRef,
  useImperativeHandle, // You must import useEffect to handle side effects
  useRef,
  useState, // You must import useEffect to handle side effects
} from "react";
import Wait from "../../../component/wait/wait.jsx";
import HashChecks from "./components/hash-checks.jsx";
import ModCard from "./components/mod-card.jsx";
import Legend from "./components/mods-legend.jsx";
import SettingsTitle from "../components/settings-tittle/settings-title.js";

import { useAction } from "../../../context/action.context.jsx";

const timeout_during_request_for_prevent_429_error = 300;

const Valheim_ModsTab = forwardRef((props, ref) => {
  const { isDevActive } = props;
  const { runAction } = useAction();
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    updatesAvailable: 0,
    errors: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hashData, setHashData] = useState(null);
  const [mods, setMods] = useState([]);

  // Use a ref to store the AbortController
  const abortControllerRef = useRef(null);
  const currentFetchRef = useRef(null);

  const fetchMods = async () => {
    // Si une opération est déjà en cours → attendre sa fin avant de relancer
    if (currentFetchRef.current) {
      try {
        setLoading(true);
        await currentFetchRef.current;
        await new Promise((resolve) =>
          setTimeout(resolve, timeout_during_request_for_prevent_429_error)
        );
      } catch {
        // On ignore les erreurs ici (AbortError, etc.)
      }
    }

    // Si un contrôleur existe → on l’abandonne
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Nouveau contrôleur
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // On capture la promesse en cours
    currentFetchRef.current = (async () => {
      setLoading(true);
      setError(null);
      setMods([]);
      setStats({ total: 0, processed: 0, updatesAvailable: 0, errors: 0 });
      setHashData(null);

      try {
        const modpackInfo = await runAction(
          () => window.electron_Valheim_API.getModsData(),
          "get-mods-data"
        );
        const allMods = modpackInfo.mods || [];
        setStats((prev) => ({ ...prev, total: allMods.length }));
        setLoading(false);

        for (const baseMod of allMods) {
          if (abortController.signal.aborted) return;

          try {
            const modDetails = await window.electron_Valheim_API.getModDetails(
              baseMod
            );
            const mod = { ...baseMod, ...modDetails };
            if (abortController.signal.aborted) return;

            setMods((prev) => [...prev, mod]);
            setStats((prev) => {
              const newStats = {
                ...prev,
                processed: prev.processed + 1,
              };
              if (mod.LastBuild && mod.LastBuild !== mod.onlineVersion) {
                newStats.updatesAvailable++;
              }
              if (mod.localVersion !== mod.onlineVersion) {
                newStats.errors++;
                setError("Il y un probléme dans votre installation.");
              }
              return newStats;
            });
          } catch (modErr) {
            if (abortController.signal.aborted) return;
            console.warn(`Error loading mod ${baseMod.mod}:`, modErr);
            setMods((prev) => [
              ...prev,
              {
                ...baseMod,
                description: "Erreur de chargement",
                error: true,
              },
            ]);
            setStats((prev) => ({
              ...prev,
              processed: prev.processed + 1,
              errors: prev.errors + 1,
            }));
            setError("Il y eu un problème lors du chargement des mods.");
          }
          await new Promise((resolve) =>
            setTimeout(resolve, timeout_during_request_for_prevent_429_error)
          );
        }

        if (!abortController.signal.aborted && isDevActive) {
          const hash = await runAction(
            () => window.electron_Valheim_API.getHashData(),
            "get-hash-data"
          );
          setHashData(hash);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error loading mods:", err);
          setError("Error loading data. Please retry.");
        }
      } finally {
        if (!abortController.signal.aborted) setLoading(false);

        abortControllerRef.current = null;
        currentFetchRef.current = null;
      }
    })();

    return currentFetchRef.current;
  };

  const freeze = () => {
    setLoading(false);
    setError("Veuillez recharger l’onglet pour voir les modifications.");
    setMods([]);
    setStats({ total: 0, processed: 0, updatesAvailable: 0, errors: 0 });
    setHashData(null);
  };

  // Expose to parent
  useImperativeHandle(ref, () => ({
    reload: () => fetchMods(),
    freeze: () => freeze(),
    stop: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    },
  }));

  return (
    <>
      <Wait isVisible={loading && stats.processed < stats.total} />

      <Legend stats={stats} error={error} isDevActive={isDevActive} />

      <br />
      <br />
      <br />

      {!loading &&
        mods.map((mod, index) => (
          <ModCard
            isDevActive={isDevActive}
            onlineVersion={mod.onlineVersion}
            localVersion={mod.localVersion}
            LastBuild={mod.LastBuild}
            installed={mod.installed}
            name={mod.name}
            description={mod.description}
            icon={mod.icon}
            type={mod.type}
            key={index}
          />
        ))}

      {hashData && isDevActive && (
        <>
          <SettingsTitle warn={false}>
            Vérification des fichiers (hash)
          </SettingsTitle>
          <HashChecks hashData={hashData} />
        </>
      )}
    </>
  );
});

export default Valheim_ModsTab;
