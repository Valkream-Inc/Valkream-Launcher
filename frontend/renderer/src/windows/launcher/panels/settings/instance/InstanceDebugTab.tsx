/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Onglet Debug (admin) : un tableau par sous-chemin géré, un tableau récapitulatif
 * « ça fonctionne ou non », et les erreurs de configuration remote.
 */

import {
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { EntryReport, EntryStatus, InstanceReport } from "@shared/types";

import { groupEntriesByPath, overlappingPaths } from "../../../../../instances/instances.helpers";
import type { DebugContent } from "../../../../../instances/instances.types";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTitle from "../component/settings-tittle/settings-title";

const STATUS: Record<EntryStatus, { label: string; color: "success" | "warning" | "error" | "default" | "info" }> = {
  "up-to-date": { label: "À jour", color: "success" },
  outdated: { label: "Mise à jour", color: "warning" },
  "not-installed": { label: "Non installé", color: "warning" },
  modified: { label: "Modifié", color: "error" },
  skipped: { label: "Désactivé", color: "default" },
  invalid: { label: "Invalide", color: "error" },
};

const StatusChip = ({ status }: { status: EntryStatus }) => (
  <Chip size="small" label={STATUS[status].label} color={STATUS[status].color} />
);

const short = (hash?: string) => (hash ? hash.slice(0, 8) : "—");

interface Props {
  report: InstanceReport;
  /** Titres personnalisés par entrée (config render). */
  debugContent?: DebugContent[];
  loading: boolean;
  onReload: (verify?: boolean) => void;
}

export default function InstanceDebugTab({ report, debugContent = [], loading, onReload }: Props) {
  const titleOf = (entry: EntryReport) =>
    debugContent.find((item) => item.entry === entry.name)?.title ?? entry.name;
  const tables = groupEntriesByPath(report.entries);
  const overlaps = overlappingPaths(report.entries);
  const { summary } = report;

  return (
    <>
      <SettingsTitle warn={true}>Debug — {report.id} ({report.channel})</SettingsTitle>

      <SettingsBox warn={false}>
        <Typography>Installation : {report.installDir}</Typography>
        <Typography>
          latest : {report.releaseVersion ?? "—"} (source : {report.releaseSource})
        </Typography>
        {report.executable && (
          <Typography>
            Exécutable : {report.executable.path} ({report.executable.exists ? "présent" : "absent"})
          </Typography>
        )}
        <Button disabled={loading} onClick={() => onReload(false)}>Recharger</Button>
        <Button disabled={loading} onClick={() => onReload(true)}>Vérifier les fichiers</Button>
      </SettingsBox>

      {report.errors.length > 0 && (
        <SettingsBox warn={true}>
          {report.errors.map((error) => (
            <Typography key={error} color="error">{error}</Typography>
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
          <Typography color="error">Bloquant : {summary.blocking.join(", ")}</Typography>
        )}
      </SettingsBox>

      {overlaps.length > 0 && (
        <SettingsBox warn={true}>
          <Typography>
            Chemins imbriqués (fichiers partagés, vérifier to_ignore / gameFolderToPreserve) :{" "}
            {overlaps.map(([outer, inner]) => `${outer} ⊃ ${inner}`).join(", ")}
          </Typography>
        </SettingsBox>
      )}

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
                      {entry.optionalSetting && ` (option : ${entry.optionalSetting})`}
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
                      {entry.files && entry.files.missing.length + entry.files.changed.length > 0 && (
                        <Typography variant="caption" display="block">
                          {entry.files.missing.length} manquant(s), {entry.files.changed.length} modifié(s)
                        </Typography>
                      )}
                      {entry.errors.map((error) => (
                        <Typography key={error} variant="caption" color="error" display="block">
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
    </>
  );
}
