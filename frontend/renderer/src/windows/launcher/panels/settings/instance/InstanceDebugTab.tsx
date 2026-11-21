/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Debug (admin, distinct de Dev) : récapitulatif « ça fonctionne ou non », un tableau
 * par sous-chemin géré (filtrable sur les problèmes), réglages, journal d'installation
 * et outils de support (copier rapport / journal, vérifier, réparer).
 */

import {
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
  { label: string; color: "success" | "warning" | "error" | "default" | "info" }
> = {
  "up-to-date": { label: "À jour", color: "success" },
  outdated: { label: "Mise à jour", color: "warning" },
  "not-installed": { label: "Non installé", color: "warning" },
  modified: { label: "Modifié", color: "error" },
  skipped: { label: "Désactivé", color: "default" },
  invalid: { label: "Invalide", color: "error" },
};

const StatusChip = ({ status }: { status: EntryStatus }) => (
  <Chip
    size="small"
    label={STATUS[status].label}
    color={STATUS[status].color}
  />
);

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
        `Journal illisible : ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }, [report.id, report.channel]);
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
            `Réparation incomplète : ${result.failed
              .map((item) => `${item.name} (${item.error})`)
              .join(", ")}`,
            { variant: "error" },
          );
        } else {
          enqueueSnackbar("Installation réparée !", { variant: "success" });
        }
      } catch (error) {
        console.error(error);
        enqueueSnackbar("Réparation impossible !", { variant: "error" });
      } finally {
        await onReload({ verify: true });
      }
    }, "repair-instance");

  // Pour le support : rapport complet (JSON) ou journal d'installation, copiés dans le presse-papiers
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      enqueueSnackbar(`${label} copié !`, { variant: "success" });
    } catch (error) {
      console.error(error);
      enqueueSnackbar(`Impossible de copier : ${label}`, { variant: "error" });
    }
  };
  const copyReport = () => copy(JSON.stringify(report, null, 2), "Rapport");
  const copyLog = () => copy(log || "(journal vide)", "Journal");

  return (
    <>
      <Wait isVisible={actionLoading} />
      <SettingsTitle warn={true}>
        Debug — {report.id} ({report.channel})
      </SettingsTitle>

      <SettingsBox warn={false}>
        <Typography>Installation : {report.installDir}</Typography>
        <Typography>
          latest : {report.releaseVersion ?? "—"} (source :{" "}
          {report.releaseSource})
        </Typography>
        {report.executable && (
          <Typography>
            Exécutable : {report.executable.path} (
            {report.executable.exists ? "présent" : "absent"})
          </Typography>
        )}
        <Button disabled={loading} onClick={() => onReload()}>
          Recharger
        </Button>
        <Button disabled={loading} onClick={() => onReload({ verify: true })}>
          Vérifier les fichiers
        </Button>
        <Button
          disabled={loading || actionLoading}
          color="warning"
          onClick={repair}
        >
          Réparer
        </Button>
        <Button onClick={copyReport}>Copier le rapport</Button>
        <Button onClick={copyLog}>Copier le journal</Button>
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
      <SettingsTitle warn={false}>Récapitulatif</SettingsTitle>
      <SettingsBox warn={!summary.works}>
        <Chip
          color={summary.works ? "success" : "error"}
          label={summary.works ? "Fonctionne" : "Ne fonctionne pas"}
        />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell>À jour</TableCell>
              <TableCell>À mettre à jour</TableCell>
              <TableCell>Non installé</TableCell>
              <TableCell>Modifié</TableCell>
              <TableCell>Désactivé</TableCell>
              <TableCell>Invalide</TableCell>
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
            Bloquant : {summary.blocking.join(", ")}
          </Typography>
        )}
      </SettingsBox>

      {overlaps.length > 0 && (
        <SettingsBox warn={true}>
          <Typography>
            Chemins imbriqués (fichiers partagés, vérifier to_ignore /
            gameFolderToPreserve) :{" "}
            {overlaps.map(([outer, inner]) => `${outer} ⊃ ${inner}`).join(", ")}
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
        label="Afficher seulement les problèmes"
      />

      {/* Un tableau par sous-chemin */}
      {tables.map((table) => (
        <div key={table.path}>
          <SettingsTitle warn={table.failing}>/{table.path}</SettingsTitle>
          <SettingsBox warn={false}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Entrée</TableCell>
                  <TableCell>Niveau</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Version (installée → remote)</TableCell>
                  <TableCell>Hash</TableCell>
                  <TableCell>Conservé</TableCell>
                  <TableCell>Ignoré</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {table.entries.map((entry) => (
                  <TableRow key={entry.name}>
                    <TableCell>
                      {titleOf(entry)}
                      {entry.optionalSetting &&
                        ` (option : ${entry.optionalSetting})`}
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
                            {entry.files.missing.length} manquant(s),{" "}
                            {entry.files.changed.length} modifié(s)
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
          <Typography>Aucun problème détecté.</Typography>
        </SettingsBox>
      )}

      {/* Réglages de l'installation */}
      <SettingsTitle warn={false}>Réglages</SettingsTitle>
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
                <TableCell>Aucun réglage enregistré</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </SettingsBox>

      {/* Journal d'installation */}
      <SettingsTitle warn={false}>Journal d'installation</SettingsTitle>
      <SettingsBox warn={false}>
        <Button onClick={loadLog}>Actualiser</Button>
        <Typography
          component="pre"
          variant="caption"
          sx={{
            maxHeight: 300,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            userSelect: "text",
          }}
        >
          {log === null ? "Chargement…" : log.trim() || "(journal vide)"}
        </Typography>
      </SettingsBox>
    </>
  );
}
