/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Tools (admin) : outils de préparation du remote, présentés en étapes simples
 * (1. source, 2. lancer avec une barre de progression, 3. résultat).
 * - Hash d'un dossier : `hash` du latest.yml + `hash.json`, export prêt pour le backend ;
 * - Liste de mods : depuis un manifest Thunderstore (`Auteur-Nom-Version`) donné en liste collée,
 *   en lien ou en fichier, avec images, descriptions et liens, prête pour `mods.config.json`.
 */

import {
  Avatar,
  Box,
  Button,
  LinearProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { enqueueSnackbar } from "notistack";
import { useEffect, useState } from "react";

import type {
  ModsListResult,
  ToolsHashSummary,
  ToolsProgress,
} from "@shared/types";

import { useTranslation } from "react-i18next";
import i18n from "../../../../../i18n";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

const fail = (error: unknown) =>
  enqueueSnackbar(error instanceof Error ? error.message : String(error), {
    variant: "error",
  });

const copy = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    enqueueSnackbar(i18n.t("tools.copied", { label }), { variant: "success" });
  } catch (error) {
    fail(error);
  }
};

const save = async (name: string, text: string) => {
  try {
    const target = await window.electron_API.toolsSaveText(name, text);
    if (target)
      enqueueSnackbar(i18n.t("tools.saved", { target }), {
        variant: "success",
      });
  } catch (error) {
    fail(error);
  }
};

const formatBytes = (bytes: number): string => {
  const units = [
    i18n.t("tools.units.b"),
    i18n.t("tools.units.kb"),
    i18n.t("tools.units.mb"),
    i18n.t("tools.units.gb"),
  ];
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

/** Progression de l'outil `tool` (événements `tools:progress` du main) ; `null` hors exécution. */
const useToolProgress = (tool: ToolsProgress["tool"], running: boolean) => {
  const [progress, setProgress] = useState<ToolsProgress | null>(null);
  useEffect(() => {
    if (!running) {
      setProgress(null);
      return;
    }
    window.electron_API.onToolsProgress((data) => {
      if (data.tool === tool) setProgress(data);
    });
    return () => window.electron_API.removeToolsProgressListeners();
  }, [tool, running]);
  return progress;
};

/** Barre de progression : déterminée quand le total est connu, sinon animée. */
function ToolProgress({
  running,
  progress,
}: {
  running: boolean;
  progress: ToolsProgress | null;
}) {
  const { t } = useTranslation();
  if (!running) return null;
  const known = progress !== null && progress.total > 0;
  return (
    <Box sx={{ width: "100%" }} role="status" aria-live="polite">
      <LinearProgress
        variant={known ? "determinate" : "indeterminate"}
        value={known ? (progress.done / progress.total) * 100 : undefined}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
        {known
          ? t("tools.progress", { done: progress.done, total: progress.total })
          : t("tools.working")}
      </Typography>
    </Box>
  );
}

/** Intitulé d'étape (« 1. Source », « 2. Lancer »…) pour guider l'outil. */
const Step = ({ index, label }: { index: number; label: string }) => (
  <Typography variant="subtitle2" sx={{ fontWeight: 700, opacity: 0.85 }}>
    {index}. {label}
  </Typography>
);

function HashFolderTool() {
  const { t } = useTranslation();
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

  const progress = useToolProgress("hash", busy);

  const pick = () =>
    run(async () => {
      const next = await window.electron_API.toolsHashFolder(lines(ignoreText));
      if (next) setResult(next);
    });

  const exportFiles = () =>
    run(async () => {
      const done = await window.electron_API.toolsExportHash(lines(ignoreText));
      if (done)
        enqueueSnackbar(t("tools.exported", { output: done.output }), {
          variant: "success",
        });
    });

  return (
    <>
      <SettingsTitle warn={false}>{t("tools.hashTitle")}</SettingsTitle>
      <SettingsBox warn={false}>
        <Stack spacing={1.5} sx={{ width: "100%" }}>
          <Step index={1} label={t("tools.stepOptions")} />
          <TextField
            size="small"
            multiline
            minRows={2}
            label={t("tools.ignoreLabel")}
            value={ignoreText}
            onChange={(event) => setIgnoreText(event.target.value)}
          />
          <Step index={2} label={t("tools.stepRun")} />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="contained" disabled={busy} onClick={pick}>
              {busy ? t("tools.computing") : t("tools.pick")}
            </Button>
            {result && (
              <Button disabled={busy} onClick={exportFiles}>
                {t("tools.exportFiles")}
              </Button>
            )}
          </Box>
          <ToolProgress running={busy} progress={progress} />
          {result && <Step index={3} label={t("tools.stepResult")} />}
          {result && (
            <>
              <Typography
                variant="body2"
                sx={{ wordBreak: "break-all", userSelect: "text" }}
              >
                {result.folder}
                <br />
                {t("tools.files", {
                  count: result.fileCount,
                  size: formatBytes(result.totalBytes),
                })}
              </Typography>
              <Typography
                variant="caption"
                sx={{ wordBreak: "break-all", userSelect: "text" }}
              >
                {t("tools.hashLine", { hash: result.hash })}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Button onClick={() => copy(result.hash, t("tools.hashName"))}>
                  {t("tools.copyHash")}
                </Button>
                <Button
                  onClick={() =>
                    copy(JSON.stringify(result.manifest, null, 2), "hash.json")
                  }
                >
                  {t("tools.copyManifest")}
                </Button>
                <Button
                  onClick={() =>
                    save("hash.json", JSON.stringify(result.manifest, null, 2))
                  }
                >
                  {t("tools.saveManifest")}
                </Button>
              </Box>
            </>
          )}
        </Stack>
      </SettingsBox>
    </>
  );
}

type ModsSourceMode = "list" | "url" | "file";

function ModsListTool() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ModsSourceMode>("list");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [result, setResult] = useState<ModsListResult | null>(null);
  const [busy, setBusy] = useState(false);
  const progress = useToolProgress("mods", busy);

  const source = mode === "list" ? text : mode === "url" ? url.trim() : (file?.text ?? "");
  const valid =
    mode === "url" ? /^https?:\/\/\S+$/.test(source) : source.trim() !== "";

  const pickFile = async () => {
    try {
      const picked = await window.electron_API.toolsOpenTextFile();
      if (picked) setFile(picked);
    } catch (error) {
      fail(error);
    }
  };

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
      <SettingsTitle warn={false}>{t("tools.modsTitle")}</SettingsTitle>
      <SettingsBox warn={false}>
        <Stack spacing={1.5} sx={{ width: "100%" }}>
          <Step index={1} label={t("tools.stepSource")} />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={mode}
            onChange={(_event, next: ModsSourceMode | null) => next && setMode(next)}
            aria-label={t("tools.stepSource")}
          >
            <ToggleButton value="list">{t("tools.mode.list")}</ToggleButton>
            <ToggleButton value="url">{t("tools.mode.url")}</ToggleButton>
            <ToggleButton value="file">{t("tools.mode.file")}</ToggleButton>
          </ToggleButtonGroup>
          {mode === "list" && (
            <TextField
              size="small"
              multiline
              minRows={4}
              label={t("tools.depsLabel")}
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
          )}
          {mode === "url" && (
            <TextField
              size="small"
              label={t("tools.urlLabel")}
              placeholder="https://…"
              value={url}
              error={url.trim() !== "" && !valid}
              helperText={url.trim() !== "" && !valid ? t("tools.urlInvalid") : undefined}
              onChange={(event) => setUrl(event.target.value)}
            />
          )}
          {mode === "file" && (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
              <Button onClick={pickFile}>{t("tools.pickFile")}</Button>
              <Typography variant="body2">
                {file ? t("tools.fileLoaded", { name: file.name }) : t("tools.noFile")}
              </Typography>
            </Box>
          )}
          <Step index={2} label={t("tools.stepRun")} />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="contained" disabled={busy || !valid} onClick={generate}>
              {busy ? t("tools.fetching") : t("tools.generate")}
            </Button>
            {result && (
              <>
                <Button onClick={() => copy(json, "mods.config.json")}>
                  {t("tools.copyJson")}
                </Button>
                <Button onClick={() => save("mods.config.json", json)}>
                  {t("tools.save")}
                </Button>
              </>
            )}
          </Box>
          <ToolProgress running={busy} progress={progress} />
          {result?.failed.map((item) => (
            <Typography key={item.id} color="warning.main" variant="caption">
              {t("tools.unavailable", { id: item.id, error: item.error })}
            </Typography>
          ))}
        </Stack>
      </SettingsBox>

      {result && (
        <>
          <SettingsTitle warn={false}>
            {t("tools.preview", { count: result.mods.length })}
          </SettingsTitle>
          {result.mods.map((mod) => {
            const description =
              typeof mod.description === "string"
                ? mod.description
                : (mod.description?.[i18n.language as "fr" | "en"] ??
                  mod.description?.en ??
                  mod.description?.fr);

            return (
              <SettingsBox key={mod.id ?? mod.name} warn={false}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <Avatar variant="rounded" src={mod.icon} alt={mod.name}>
                    {mod.name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{mod.name}</Typography>
                    {description && (
                      <Typography variant="body2">{description}</Typography>
                    )}
                  </Box>
                </Box>
              </SettingsBox>
            );
          })}
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
