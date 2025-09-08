import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import ModCard from "./component/mod-card.jsx";
import Legend from "./component/mods-legend.jsx";
import HashChecks from "./component/hash-checks.jsx";
import Wait from "../../component/wait/wait.jsx";

const ModsTab = forwardRef((props, ref) => {
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

  // Utiliser useRef pour stocker l'AbortController
  const abortControllerRef = useRef(null);

  const fetchMods = async () => {
    // Si une opération est déjà en cours, on l'annule avant de commencer
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouvel AbortController et le stocker dans la référence
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);
    setMods([]);
    setStats({ total: 0, processed: 0, updatesAvailable: 0, errors: 0 });
    setHashData(null);

    try {
      const modpackInfo = await window.electron_API.getModsData();
      console.log(modpackInfo);
      const allMods = modpackInfo.mods || [];
      setStats((prev) => ({ ...prev, total: allMods.length }));

      for (const baseMod of allMods) {
        if (abortController.signal.aborted) {
          console.log("Chargement annulé");
          return;
        }

        try {
          const modDetails = await window.electron_API.getModDetails(baseMod);
          const mod = { ...baseMod, ...modDetails };

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
            }
            return newStats;
          });
        } catch (modErr) {
          if (abortController.signal.aborted) return;
          console.warn(
            `Erreur de chargement pour le mod ${baseMod.mod}:`,
            modErr
          );

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
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (abortController.signal.aborted) return;
      // const hash = await window.electron_API.getHashData();
      // setHashData(hash);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Erreur lors du chargement des mods:", err);
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    fetchMods();
    return () => {
      // Nettoyer la référence si le composant est démonté
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Exposer les fonctions au composant parent
  useImperativeHandle(ref, () => ({
    reload: () => fetchMods(),
    stop: () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log("Arrêt du chargement demandé.");
        setLoading(false);
      }
    },
  }));

  return (
    <>
      <Wait isVisible={loading && stats.processed < stats.total} />

      <Legend stats={stats} error={error} />
      <br />
      <br />
      <br />

      {mods.map((mod, index) => (
        <ModCard
          isDevActive={true}
          onlineVersion={mod.onlineVersion}
          localVersion={mod.localVersion}
          LastBuild={mod.LastBuild}
          installed={mod.installed}
          name={mod.name}
          description={mod.description}
          icon={mod.icon}
          key={index}
        />
      ))}

      {hashData && <HashChecks hashData={hashData} />}
    </>
  );
});

export default ModsTab;
