/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Debug (admin, distinct de Dev) : récapitulatif « ça fonctionne ou non », un tableau
 * par sous-chemin géré (filtrable sur les problèmes), réglages, journal d'installation
 * et outils de support (copier rapport / journal, vérifier, réparer).
 */

import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import type { EntryReport, EntryStatus, InstanceReport } from "@shared/types";
import { enqueueSnackbar } from "notistack";

import { useTranslation } from "react-i18next";
import i18n, { languageOf } from "../../../../../i18n";
import {
  formatInstallLog,
  formatLogTime,
  logMessage,
  parseInstallLog,
} from "../../../../../instances/install-log";
import {
  groupEntriesByPath,
  overlappingPaths,
} from "../../../../../instances/instances.helpers";
import type { DebugContent } from "../../../../../instances/instances.types";
import Wait from "../../../component/wait/wait";
import { useAction } from "../../../context/action.context";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-title/settings-title";

const STATUS: Record<
  EntryStatus,
  { color: "success" | "warning" | "error" | "default" | "info" }
> = {
  "up-to-date": { color: "success" },
  outdated: { color: "warning" },
  "not-installed": { color: "warning" },
  modified: { color: "error" },
  skipped: { color: "default" },
  invalid: { color: "error" },
};

const StatusChip = ({ status }: { status: EntryStatus }) => {
  const { t } = useTranslation();
  return (
    <Chip
      size="small"
      label={t(`debug.status.${status}`)}
      color={STATUS[status].color}
    />
  );
};

const LEVEL_COLOR = {
  INFO: "info.main",
  WARN: "warning.main",
  ERROR: "error.main",
} as const;

const short = (hash?: string) => (hash ? hash.slice(0, 8) : "—");

interface Props {
  report: InstanceReport;
  /** Titres personnalisés par entrée (config render). */
  debugContent?: DebugContent[];
  loading: boolean;
  onReload: (options?: {
    verify?: boolean;
    silent?: boolean;
  }) => void | Promise<void>;
}

export default function InstanceDebugTab({
  report,
  debugContent = [],
  loading,
  onReload,
}: Props) {
  const { t } = useTranslation();
  const titleOf = (entry: EntryReport) =>
    debugContent.find((item) => item.entry === entry.name)?.title ?? entry.name;
  const [problemsOnly, setProblemsOnly] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const isProblem = (entry: EntryReport) =>
    !["up-to-date", "skipped"].includes(entry.status);
  const tables = groupEntriesByPath(report.entries)
    .map((table) =>
      problemsOnly
        ? { ...table, entries: table.entries.filter(isProblem) }
        : table,
    )
    .filter((table) => table.entries.length > 0);

  const loadLog = useCallback(async () => {
    try {
      setLog(
        await window.electron_API.getInstanceLog(report.id, report.channel),
      );
    } catch (error) {
      setLog(
        t("debug.logUnreadable", {
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }, [report.id, report.channel, t]);
  useEffect(() => {
    void loadLog();
  }, [loadLog, report]);
  const overlaps = overlappingPaths(report.entries);
  const { summary } = report;
  const { actionLoading, runAction } = useAction();

  // Réparer = synchroniser en retéléchargeant aussi les fichiers modifiés ou manquants
  const repair = () =>
    runAction(async () => {
      try {
        const result = await window.electron_API.syncInstance(
          report.id,
          report.channel,
          { repair: true },
        );
        if (result.failed.length > 0) {
          enqueueSnackbar(
            t("debug.repairIncomplete", {
              failed: result.failed
                .map((item) => `${item.name} (${item.error})`)
                .join(", "),
            }),
            { variant: "error" },
          );
        } else {
          enqueueSnackbar(t("debug.repaired"), { variant: "success" });
        }
      } catch (error) {
        console.error(error);
        enqueueSnackbar(t("debug.repairFailed"), { variant: "error" });
      } finally {
        await onReload({ verify: true });
      }
    }, "repair-instance");

  // Pour le support : rapport complet (JSON) ou journal d'installation, copiés dans le presse-papiers
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(t("debug.copied", { label }), { variant: "success" });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t("debug.copyFailed", { label }), { variant: "error" });
    }
  };
  const copyReport = () =>
    copy(JSON.stringify(report, null, 2), t("debug.report"));
  const logLines = parseInstallLog(log ?? "");
  const tr = (key: string, vars?: Record<string, string | number>): string =>
    String(vars ? t(key, vars) : t(key));
  const copyLog = () =>
    copy(
      logLines.length > 0
        ? formatInstallLog(logLines, tr)
        : t("debug.emptyLog"),
      t("debug.log"),
    );

  return (
    <>
      <Wait isVisible={actionLoading} />
      <SettingsTitle warn={true}>
        Debug — {report.id} ({report.channel})
      </SettingsTitle>

      <SettingsBox warn={false}>
        <Typography>
          {t("debug.installation", { dir: report.installDir })}
        </Typography>
        <Typography>
          {t("debug.latest", {
            version: report.releaseVersion ?? "—",
            source: report.releaseSource,
          })}
        </Typography>
        {report.executable && (
          <Typography>
            {t("debug.executable", {
              path: report.executable.path,
              state: report.executable.exists
                ? t("debug.present")
                : t("debug.absent"),
            })}
          </Typography>
        )}
        <Button disabled={loading} onClick={() => onReload()}>
          {t("debug.reload")}
        </Button>
        <Button disabled={loading} onClick={() => onReload({ verify: true })}>
          {t("debug.verify")}
        </Button>
        <Button
          disabled={loading || actionLoading}
          color="warning"
          onClick={repair}
        >
          {t("debug.repair")}
        </Button>
        <Button onClick={copyReport}>{t("debug.copyReport")}</Button>
        <Button onClick={copyLog}>{t("debug.copyLog")}</Button>
      </SettingsBox>

      {report.errors.length > 0 && (
        <SettingsBox warn={true}>
          {report.errors.map((error) => (
            <Typography key={error} color="error">
              {error}
            </Typography>
          ))}
        </SettingsBox>
      )}

      {/* Récapitulatif */}
      <SettingsTitle warn={false}>{t("debug.summary")}</SettingsTitle>
      <SettingsBox warn={!summary.works}>
        <Chip
          color={summary.works ? "success" : "error"}
          label={summary.works ? t("debug.works") : t("debug.broken")}
        />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("debug.total")}</TableCell>
              <TableCell>{t("debug.status.up-to-date")}</TableCell>
              <TableCell>{t("debug.toUpdate")}</TableCell>
              <TableCell>{t("debug.status.not-installed")}</TableCell>
              <TableCell>{t("debug.status.modified")}</TableCell>
              <TableCell>{t("debug.status.skipped")}</TableCell>
              <TableCell>{t("debug.status.invalid")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>{summary.total}</TableCell>
              <TableCell>{summary.upToDate}</TableCell>
              <TableCell>{summary.outdated}</TableCell>
              <TableCell>{summary.notInstalled}</TableCell>
              <TableCell>{summary.modified}</TableCell>
              <TableCell>{summary.skipped}</TableCell>
              <TableCell>{summary.invalid}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
        {summary.blocking.length > 0 && (
          <Typography color="error">
            {t("debug.blocking", { list: summary.blocking.join(", ") })}
          </Typography>
        )}
      </SettingsBox>

      {overlaps.length > 0 && (
        <SettingsBox warn={true}>
          <Typography>
            {t("debug.overlaps", {
              list: overlaps
                .map(([outer, inner]) => `${outer} ⊃ ${inner}`)
                .join(", "),
            })}
          </Typography>
        </SettingsBox>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={problemsOnly}
            onChange={(event) => setProblemsOnly(event.target.checked)}
          />
        }
        label={t("debug.problemsOnly")}
      />

      {/* Un tableau par sous-chemin */}
      {tables.map((table) => (
        <div key={table.path}>
          <SettingsTitle warn={table.failing}>/{table.path}</SettingsTitle>
          <SettingsBox warn={false}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t("debug.entry")}</TableCell>
                  <TableCell>{t("debug.tier")}</TableCell>
                  <TableCell>{t("debug.type")}</TableCell>
                  <TableCell>{t("debug.version")}</TableCell>
                  <TableCell>{t("debug.hash")}</TableCell>
                  <TableCell>{t("debug.preserved")}</TableCell>
                  <TableCell>{t("debug.ignored")}</TableCell>
                  <TableCell>{t("debug.statusColumn")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {table.entries.map((entry) => (
                  <TableRow key={entry.name}>
                    <TableCell>
                      {titleOf(entry)}
                      {entry.optionalSetting &&
                        t("debug.option", { name: entry.optionalSetting })}
                    </TableCell>
                    <TableCell>{entry.tier}</TableCell>
                    <TableCell>{entry.type}</TableCell>
                    <TableCell>
                      {entry.installedVersion ?? "—"} → {entry.declaredVersion}
                    </TableCell>
                    <TableCell>
                      {short(entry.installedHash)} → {short(entry.declaredHash)}
                    </TableCell>
                    <TableCell>{entry.preserved.join(", ") || "—"}</TableCell>
                    <TableCell>{entry.toIgnore.join(", ") || "—"}</TableCell>
                    <TableCell>
                      <StatusChip status={entry.status} />
                      {entry.files &&
                        entry.files.missing.length +
                          entry.files.changed.length >
                          0 && (
                          <Typography
                            variant="caption"
                            sx={{ display: "block" }}
                          >
                            {t("debug.filesCount", {
                              missing: entry.files.missing.length,
                              changed: entry.files.changed.length,
                            })}
                          </Typography>
                        )}
                      {entry.errors.map((error) => (
                        <Typography
                          key={error}
                          variant="caption"
                          color="error"
                          sx={{ display: "block" }}
                        >
                          {error}
                        </Typography>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SettingsBox>
        </div>
      ))}

      {tables.length === 0 && problemsOnly && (
        <SettingsBox warn={false}>
          <Typography>{t("debug.noProblem")}</Typography>
        </SettingsBox>
      )}

      {/* Réglages de l'installation */}
      <SettingsTitle warn={false}>{t("debug.settings")}</SettingsTitle>
      <SettingsBox warn={false}>
        <Table size="small">
          <TableBody>
            {Object.entries(report.settings).map(([name, value]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell>{String(value)}</TableCell>
              </TableRow>
            ))}
            {Object.keys(report.settings).length === 0 && (
              <TableRow>
                <TableCell>{t("debug.noSettings")}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SettingsBox>

      {/* Journal d'installation */}
      <SettingsTitle warn={false}>{t("debug.installLog")}</SettingsTitle>
      <SettingsBox warn={false}>
        <Button onClick={loadLog}>{t("debug.refresh")}</Button>
        <Box
          component="div"
          sx={{
            maxHeight: 360,
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: 12,
            lineHeight: 1.6,
            userSelect: "text",
            borderRadius: 1,
            p: 1,
            bgcolor: "rgba(0,0,0,0.25)",
          }}
        >
          {log === null && t("common.loading")}
          {log !== null && logLines.length === 0 && t("debug.emptyLog")}
          {logLines.map((line, index) =>
            line.kind === "raw" ? (
              <Box
                key={index}
                sx={{ color: "text.secondary", wordBreak: "break-all" }}
              >
                {line.text}
              </Box>
            ) : (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  gap: 1.5,
                  mt: line.record.sep && index > 0 ? 1.5 : 0,
                  pt: line.record.sep && index > 0 ? 1 : 0,
                  borderTop:
                    line.record.sep && index > 0
                      ? "1px solid rgba(255,255,255,0.12)"
                      : "none",
                  borderLeft: "3px solid",
                  borderLeftColor: LEVEL_COLOR[line.record.level],
                  pl: 1,
                  bgcolor:
                    line.record.level === "ERROR"
                      ? "rgba(244,67,54,0.10)"
                      : "transparent",
                }}
              >
                <Box
                  component="span"
                  sx={{ color: "text.secondary", whiteSpace: "nowrap" }}
                >
                  {formatLogTime(line.record.time)}
                </Box>
                <Box
                  component="span"
                  sx={{
                    color: LEVEL_COLOR[line.record.level],
                    fontWeight: 700,
                    minWidth: 44,
                  }}
                >
                  {line.record.level}
                </Box>
                <Box
                  component="span"
                  sx={{
                    wordBreak: "break-word",
                    color:
                      line.record.level === "INFO"
                        ? "text.primary"
                        : LEVEL_COLOR[line.record.level],
                    fontWeight:
                      line.record.key === "log.start" ||
                      line.record.key === "log.summary"
                        ? 700
                        : 400,
                  }}
                >
                  {logMessage(line.record, tr, languageOf(i18n.language))}
                </Box>
              </Box>
            ),
          )}
        </Box>
      </SettingsBox>
    </>
  );
}
