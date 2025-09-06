import React, { useState, useEffect } from "react";
import { Grid } from "@mui/material";
import ModCard from "./component/mod-card.jsx";
import Legend from "./component/mods-legend.jsx";
import HashChecks from "./component/hash-checks.jsx";
import Wait from "../../component/wait/wait.jsx";

function ModsTab() {
  const [mods, setMods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hashData, setHashData] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    processed: 0,
    updatesAvailable: 0,
    errors: 0,
  });

  useEffect(() => {
    const abortController = new AbortController();

    const fetchMods = async () => {
      setLoading(true);
      setError(null);
      setMods([]);
      setStats({ total: 0, processed: 0, updatesAvailable: 0, errors: 0 });

      try {
        // Étape 1 : infos de base
        const modpackInfo = await window.api.getModData();
        const allMods = modpackInfo.mods || [];
        setStats((prev) => ({ ...prev, total: allMods.length }));

        // Étape 2 : détails mod par mod
        for (const baseMod of allMods) {
          if (abortController.signal.aborted) return;

          try {
            const modDetails = await window.api.getModDetails(baseMod);
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
            console.warn(`Erreur chargement mod ${baseMod.mod}:`, modErr);
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

          // petit délai pour fluidifier le rendu
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Étape 3 : hash global
        const hash = await window.api.getHashData();
        setHashData(hash);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Erreur lors du chargement des mods:", err);
          setError(
            "Erreur lors du chargement des données. Veuillez réessayer."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMods();
    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <>
      <Wait isVisible={loading && stats.processed < stats.total} />

      <Legend stats={stats} error={error} />
      <br />
      <br />
      <br />
      <ModCard
        isDevActive={true}
        onlineVersion={"-ee"}
        localVersion={"-ee"}
        LastBuild={"-ee"}
        installed={true}
        name={"Chargement des mods..."}
        description={"Veuillez patienter..."}
        icon={"icon.png"}
      />
      <ModCard
        onlineVersion={"-"}
        localVersion={"-e"}
        LastBuild={"dfsf"}
        installed={false}
        name={"Chargement des mods..."}
        description={"Veuillez patienter..."}
        icon={"icon.png"}
      />
      <ModCard
        onlineVersion={"-"}
        localVersion={"-e"}
        LastBuild={"-"}
        installed={false}
        name={"Chargement des mods..."}
        description={"Veuillez patienter..."}
        icon={"icon.png"}
      />
      <ModCard
        onlineVersion={"-"}
        localVersion={"-e"}
        LastBuild={"-"}
        installed={false}
        name={"Chargement des mods..."}
        description={"Veuillez patienter..."}
        icon={"icon.png"}
      />

      <Grid container spacing={2}>
        {mods.map((mod, index) => (
          <Grid item xs={12} key={index}>
            <ModCard mod={mod} />
          </Grid>
        ))}
      </Grid>

      {hashData && <HashChecks hashData={hashData} />}
    </>
  );
}

export default ModsTab;
