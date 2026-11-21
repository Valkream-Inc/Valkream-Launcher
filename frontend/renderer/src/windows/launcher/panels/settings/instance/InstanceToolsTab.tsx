/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Tools (admin) : outils de préparation du remote.
 * - Hash d'un dossier : `hash` du latest.yml + `hash.json`, export prêt pour le backend ;
 * - Liste de mods : depuis un manifest Thunderstore (`Auteur-Nom-Version`), avec images,
 *   descriptions et liens, prête à coller dans `mods.config.json`.
 */

import {
  Avatar,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useState } from "react";

import type { ModsListResult, ToolsHashSummary } from "@shared/types";

import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

const fail = (error: unknown) =>
  enqueueSnackbar(error instanceof Error ? error.message : String(error), {
    variant: "error",
  });

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    enqueueSnackbar(`${label} copié`, { variant: "success" });
  } catch (error) {
    fail(error);
  }
};

const save = async (name: string, text: string) => {
  try {
    const target = await window.electron_API.toolsSaveText(name, text);
    if (target)
      enqueueSnackbar(`Enregistré : ${target}`, { variant: "success" });
  } catch (error) {
    fail(error);
  }
};

const formatBytes = (bytes: number): string => {
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) ((value /= 1024), unit++);
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

const lines = (text: string) =>
  text
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

function HashFolderTool() {
  const [ignoreText, setIgnoreText] = useState("");
  const [result, setResult] = useState<ToolsHashSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const pick = () =>
    run(async () => {
      const next = await window.electron_API.toolsHashFolder(lines(ignoreText));
      if (next) setResult(next);
    });

  const exportFiles = () =>
    run(async () => {
      const done = await window.electron_API.toolsExportHash(lines(ignoreText));
      if (done)
        enqueueSnackbar(`hash.json et hash/ écrits dans ${done.output}`, {
          variant: "success",
        });
    });

  return (
    <>
      <SettingsTitle warn={false}>Hash d'un dossier</SettingsTitle>
      <SettingsBox warn={false}>
        <Stack spacing={1}>
          <TextField
            size="small"
            multiline
            minRows={2}
            label="to_ignore (un motif par ligne : logs, *.cfg, config/client.cfg…)"
            value={ignoreText}
            onChange={(event) => setIgnoreText(event.target.value)}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button disabled={busy} onClick={pick}>
              {busy ? "Calcul…" : "Choisir un dossier et hasher"}
            </Button>
            {result && (
              <Button disabled={busy} onClick={exportFiles}>
                Exporter hash.json + fichiers
              </Button>
            )}
          </Box>
          {result && (
            <>
              <Typography
                variant="body2"
                sx={{ wordBreak: "break-all", userSelect: "text" }}
              >
                {result.folder}
                <br />
                {result.fileCount} fichier(s) · {formatBytes(result.totalBytes)}
              </Typography>
              <Typography
                variant="caption"
                sx={{ wordBreak: "break-all", userSelect: "text" }}
              >
                hash : {result.hash}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button onClick={() => copy(result.hash, "Hash")}>
                  Copier le hash
                </Button>
                <Button
                  onClick={() =>
                    copy(JSON.stringify(result.manifest, null, 2), "hash.json")
                  }
                >
                  Copier hash.json
                </Button>
                <Button
                  onClick={() =>
                    save("hash.json", JSON.stringify(result.manifest, null, 2))
                  }
                >
                  Enregistrer hash.json
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </SettingsBox>
    </>
  );
}

function ModsListTool() {
  const [source, setSource] = useState("");
  const [result, setResult] = useState<ModsListResult | null>(null);
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      setResult(await window.electron_API.toolsModsList(source));
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  };

  const json = result ? JSON.stringify(result.mods, null, 2) : "";

  return (
    <>
      <SettingsTitle warn={false}>
        Liste de mods depuis un manifest
      </SettingsTitle>
      <SettingsBox warn={false}>
        <Stack spacing={1}>
          <TextField
            size="small"
            multiline
            minRows={4}
            label="Dépendances Thunderstore (Auteur-Nom-Version, une par ligne, tableau JSON ou lien)"
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button disabled={busy || source.trim() === ""} onClick={generate}>
              {busy ? "Récupération…" : "Générer la liste"}
            </Button>
            {result && (
              <>
                <Button onClick={() => copy(json, "mods.config.json")}>
                  Copier le JSON
                </Button>
                <Button onClick={() => save("mods.config.json", json)}>
                  Enregistrer
                </Button>
              </>
            )}
          </Box>
          {result?.failed.map((item) => (
            <Typography key={item.id} color="warning.main" variant="caption">
              ⚠️ {item.id} : infos indisponibles ({item.error})
            </Typography>
          ))}
        </Stack>
      </SettingsBox>

      {result && (
        <>
          <SettingsTitle warn={false}>
            Aperçu ({result.mods.length})
          </SettingsTitle>
          {result.mods.map((mod) => (
            <SettingsBox key={mod.id ?? mod.name} warn={false}>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Avatar variant="rounded" src={mod.icon} alt={mod.name}>
                  {mod.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{mod.name}</Typography>
                  {mod.description && (
                    <Typography variant="body2">{mod.description}</Typography>
                  )}
                </Box>
              </Box>
            </SettingsBox>
          ))}
        </>
      )}
    </>
  );
}

export default function InstanceToolsTab() {
  return (
    <>
      <HashFolderTool />
      <ModsListTool />
    </>
  );
}
