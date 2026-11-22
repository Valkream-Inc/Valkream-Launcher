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
        <Stack spacing={1}>
          <TextField
            size="small"
            multiline
            minRows={2}
            label={t("tools.ignoreLabel")}
            value={ignoreText}
            onChange={(event) => setIgnoreText(event.target.value)}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button disabled={busy} onClick={pick}>
              {busy ? t("tools.computing") : t("tools.pick")}
            </Button>
            {result && (
              <Button disabled={busy} onClick={exportFiles}>
                {t("tools.exportFiles")}
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

function ModsListTool() {
  const { t } = useTranslation();
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
      <SettingsTitle warn={false}>{t("tools.modsTitle")}</SettingsTitle>
      <SettingsBox warn={false}>
        <Stack spacing={1}>
          <TextField
            size="small"
            multiline
            minRows={4}
            label={t("tools.depsLabel")}
            value={source}
            onChange={(event) => setSource(event.target.value)}
          />
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button disabled={busy || source.trim() === ""} onClick={generate}>
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
