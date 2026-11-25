/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Le jeu du joueur est absent ou d'une autre version (`steam_library`) : trois solutions.
 * 1. mode d'emploi (Markdown) pour installer la bonne version dans Steam ;
 * 2. localiser une installation (dossier choisi, jamais modifié, fichiers en trop ignorés) ;
 * 3. DepotDownloader : version exacte téléchargée depuis Steam, connexion par QR code.
 */

import { useEffect, useRef, useState } from "react";

import { notify } from "@/src/utils/notify";
import { useAction } from "../../../../context/action.context";

import { Alert, Box, LinearProgress, Stack, Typography } from "@mui/material";
import type {
  Channel,
  DepotInfo,
  DepotStepName,
  InstanceId,
  SteamSourceIssue,
} from "@shared/types";

import { useTranslation } from "react-i18next";
import { ipcErrorMessage } from "../../../../../../i18n/ipc-error";
import { isQrLine, qrModules } from "../../../../../../i18n/qr-block";
import Popup from "../../../../component/popup/popup";
import type { PopupButton } from "../../../../component/popup/popup.types";
import SimpleMarkdown from "./simple-markdown";

/** État du téléchargement DepotDownloader, remonté au bouton principal (le popup peut être masqué pendant ce temps). */
export interface DepotRunState {
  running: boolean;
  percent: number | null;
  step: DepotStepName | null;
}

interface Props {
  issue: SteamSourceIssue | null;
  /** Popup affiché (le joueur peut le masquer : un téléchargement en cours continue). */
  open: boolean;
  onDepotState?: (state: DepotRunState) => void;
  instanceId: InstanceId;
  channel: Channel;
  onClose: () => void;
  /** Une source est prête : on relance l'installation. */
  onRetry: () => void;
}

/** Numéro d'étape affiché (outil, connexion, téléchargement, vérification). */
const STEP_NUMBER: Record<DepotStepName, number> = {
  "tool-verify": 1,
  "tool-download": 1,
  "tool-extract": 1,
  login: 2,
  download: 3,
  finish: 4,
};

/** Styles de barre de défilement propres et cohérents avec le thème MUI. */
const CLEAN_SCROLLBAR_SX = {
  scrollbarWidth: "thin" as const,
  scrollbarColor: "rgba(128, 128, 128, 0.45) transparent",
  "&::-webkit-scrollbar": {
    width: 8,
    height: 8,
  },
  "&::-webkit-scrollbar-track": {
    background: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "rgba(128, 128, 128, 0.4)",
    borderRadius: 999,
    border: "2px solid transparent",
    backgroundClip: "content-box",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "rgba(128, 128, 128, 0.65)",
  },
};

/** Nettoie les séquences ANSI et les caractères de remplacement sans déclencher no-control-regex. */
const ESC = String.fromCharCode(0x1b);
const ANSI_ESCAPE_REGEX = new RegExp(`${ESC}\\[[0-9;]*[A-Za-z]`, "g");

const sanitizeTerminalLine = (raw: string): string =>
  raw
    .replace(ANSI_ESCAPE_REGEX, "")
    .replace(/\uFFFD/g, " ")
    .replace(/\r/g, "");

/** Détection de secours si une ligne appartient à un QR code console. */
const isQrLineFallback = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length < 10) return false;
  return /^[█▀▄▌▐■□#\s]+$/.test(line) && /[█▀▄▌▐■#]/.test(line);
};

/** Conversion de secours des blocs console (demi-blocs ou blocs pleins) en grille booléenne. */
const parseQrFallback = (lines: string[]): boolean[][] | null => {
  const nonEmpty = lines.filter((l) => l.trim().length > 0);
  if (nonEmpty.length < 10) return null;

  const hasHalfBlocks = nonEmpty.some((l) => /[▀▄]/.test(l));
  const maxWidth = Math.max(...nonEmpty.map((l) => l.length));
  const grid: boolean[][] = [];

  for (const rawLine of nonEmpty) {
    const line = rawLine.padEnd(maxWidth, " ");
    if (hasHalfBlocks) {
      const topRow: boolean[] = [];
      const bottomRow: boolean[] = [];
      for (const ch of line) {
        if (ch === "█" || ch === "#") {
          topRow.push(true);
          bottomRow.push(true);
        } else if (ch === "▀") {
          topRow.push(true);
          bottomRow.push(false);
        } else if (ch === "▄") {
          topRow.push(false);
          bottomRow.push(true);
        } else {
          topRow.push(false);
          bottomRow.push(false);
        }
      }
      grid.push(topRow, bottomRow);
    } else {
      grid.push(
        Array.from(line, (ch) => ch === "█" || ch === "#" || ch === "■"),
      );
    }
  }

  return grid;
};

/** Normalise une grille booléenne pour garantir une largeur uniforme. */
const normalizeGrid = (
  grid: boolean[][] | null | undefined,
): boolean[][] | null => {
  if (!grid || grid.length === 0) return null;
  const maxCols = Math.max(...grid.map((row) => row.length));
  if (maxCols === 0) return null;
  return grid.map((row) =>
    Array.from({ length: maxCols }, (_, x) => Boolean(row[x])),
  );
};

/** Rogne les lignes et colonnes entièrement vides (false) autour de la grille. */
const trimGrid = (grid: boolean[][]): boolean[][] => {
  if (grid.length === 0 || grid[0].length === 0) return grid;

  let top = 0;
  let bottom = grid.length - 1;
  let left = 0;
  let right = grid[0].length - 1;

  while (top <= bottom && grid[top].every((cell) => !cell)) top++;
  while (bottom >= top && grid[bottom].every((cell) => !cell)) bottom--;

  while (
    left <= right &&
    grid.slice(top, bottom + 1).every((row) => !row[left])
  ) {
    left++;
  }
  while (
    right >= left &&
    grid.slice(top, bottom + 1).every((row) => !row[right])
  ) {
    right--;
  }

  if (top > bottom || left > right) return grid;

  return grid.slice(top, bottom + 1).map((row) => row.slice(left, right + 1));
};

/** QR code de connexion redessiné en SVG (carrés pleins noirs sur fond blanc, marge symétrique de 2 modules). */
const QrCode = ({ lines }: { lines: string[] }) => {
  const parsed = qrModules(lines) ?? parseQrFallback(lines);
  const normalized = normalizeGrid(parsed);
  const grid = normalized ? trimGrid(normalized) : null;
  if (!grid) return null;

  const margin = 2;
  const height = grid.length;
  const width = grid[0].length;
  const viewBoxWidth = width + margin * 2;
  const viewBoxHeight = height + margin * 2;
  const pixelSize = Math.min(280, viewBoxWidth * 6);

  return (
    <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
      <Box
        sx={{
          p: 1.5,
          bgcolor: "#ffffff",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: 1,
          display: "inline-flex",
        }}
      >
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          width={pixelSize}
          height={Math.round((pixelSize * viewBoxHeight) / viewBoxWidth)}
          shapeRendering="crispEdges"
          role="img"
          aria-label="Steam QR code"
          style={{ display: "block" }}
        >
          <rect
            x={0}
            y={0}
            width={viewBoxWidth}
            height={viewBoxHeight}
            fill="#ffffff"
          />
          {grid.map((row, y) =>
            row.map((dark, x) =>
              dark ? (
                <rect
                  key={`${x}-${y}`}
                  x={x + margin}
                  y={y + margin}
                  width={1}
                  height={1}
                  fill="#000000"
                />
              ) : null,
            ),
          )}
        </svg>
      </Box>
    </Box>
  );
};

const INFO_KEY = "valkream.depot-info-accepted";

const infoAccepted = (): boolean => {
  try {
    return localStorage.getItem(INFO_KEY) === "1";
  } catch {
    return false;
  }
};

/** Lignes gardées à l'écran : assez pour le QR code et l'historique récent. */
const MAX_LINES = 80;

export default function SteamSourceDialog({
  issue,
  open,
  onDepotState,
  instanceId,
  channel,
  onClose,
  onRetry,
}: Props) {
  const { t } = useTranslation();
  const { setKeepAlive } = useAction();
  const [depotRunning, setDepotRunning] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [percent, setPercent] = useState<number | null>(null);
  const [step, setStep] = useState<DepotStepName | null>(null);
  const [qrLines, setQrLines] = useState<string[]>([]);
  const qrRun = useRef<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<DepotInfo | null>(null);
  const logBoxRef = useRef<HTMLPreElement | null>(null);
  const mounted = useRef(true);
  // Dernier `onRetry` : appelé même si le popup a été démonté entre-temps (la suite de l'installation ne doit pas se perdre)
  const retryRef = useRef(onRetry);
  retryRef.current = onRetry;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.electron_API.removeDepotOutputListeners();
    };
  }, []);

  // Nouveau problème (nouvelle tentative qui échoue) : les messages de la tentative précédente disparaissent
  useEffect(() => {
    if (issue === null) return;
    setError(null);
  }, [issue]);

  // Téléchargement de fond : l'accueil reste monté (changer de thème / ouvrir les réglages ne l'interrompt pas)
  useEffect(() => {
    setKeepAlive(depotRunning);
    return () => setKeepAlive(false);
  }, [depotRunning]);

  // Le bouton principal affiche la progression quand le popup est masqué
  useEffect(() => {
    onDepotState?.({ running: depotRunning, percent, step });
  }, [depotRunning, percent, step]);

  // Auto-scroll en bas de la console de logs à chaque nouvelle ligne
  useEffect(() => {
    const el = logBoxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const retry = () => {
    setError(null);
    onRetry();
  };

  const pickFolder = async () => {
    setError(null);
    try {
      const folder = await window.electron_API.pickInstanceSource(
        instanceId,
        channel,
      );
      if (folder) onRetry();
    } catch (err) {
      setError(ipcErrorMessage(err));
    }
  };

  const askDepot = async () => {
    if (infoAccepted()) return startDepot();
    try {
      setInfo(await window.electron_API.getDepotInfo(instanceId, channel));
    } catch (err) {
      setError(ipcErrorMessage(err));
    }
  };

  const acceptInfo = () => {
    try {
      localStorage.setItem(INFO_KEY, "1");
    } catch {
      /* stockage indisponible : l'écran sera réaffiché */
    }
    setInfo(null);
    void startDepot();
  };

  const startDepot = async () => {
    setError(null);
    setLines([]);
    setPercent(null);
    setStep(null);
    setQrLines([]);
    qrRun.current = [];
    setDepotRunning(true);

    window.electron_API.onDepotOutput((data) => {
      if (
        data.id !== instanceId ||
        data.channel !== channel ||
        !mounted.current
      ) {
        return;
      }

      if (data.line !== undefined) {
        const subLines = sanitizeTerminalLine(data.line).split("\n");
        for (const rawSub of subLines) {
          const line = rawSub.trimEnd();
          if (isQrLine(line) || isQrLineFallback(line)) {
            qrRun.current = [...qrRun.current, line];
            setQrLines(qrRun.current);
          } else if (line.trim().length > 0) {
            qrRun.current = [];
            setLines((previous) => [...previous, line].slice(-MAX_LINES));
          }
        }
      }

      if (data.step !== undefined) {
        setStep(data.step);
        if (data.step === "login") notify(t("notify.actionTitle"), t("notify.qrAction"));
        if (data.step !== "login") setQrLines([]);
        setPercent(null);
      }

      if (data.percent !== undefined) setPercent(data.percent);
    });

    try {
      await window.electron_API.depotDownloadInstance(instanceId, channel);
      notify(t("notify.doneTitle"), t("notify.depotDone"));
      retryRef.current();
    } catch (err) {
      const message = ipcErrorMessage(err);
      if (mounted.current) setError(message);
      notify(t("notify.errorTitle"), message);
    } finally {
      window.electron_API.removeDepotOutputListeners();
      if (mounted.current) setDepotRunning(false);
    }
  };

  const cancelDepot = () =>
    window.electron_API.cancelDepotDownload(instanceId, channel);

  const content = (
    <Box
      sx={{
        textAlign: "left",
        maxHeight: "52vh",
        overflowY: "auto",
        pr: 1,
        ...CLEAN_SCROLLBAR_SX,
      }}
    >
      {issue && <SimpleMarkdown source={issue.guide} />}
      {depotRunning && (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <Alert severity="info" variant="outlined" sx={{ color: "inherit" }}>
            {step
              ? `${t("steam.stepCount", { current: STEP_NUMBER[step], total: 4 })} — ${t(`steam.step.${step}`)}`
              : t("steam.step.tool-verify")}
          </Alert>
          {(step === "login" || qrLines.length > 0) && (
            <Alert severity="warning" variant="outlined" sx={{ color: "inherit" }}>
              {t("steam.scan")}
            </Alert>
          )}
          {(step === "login" || qrLines.length > 0) && <QrCode lines={qrLines} />}
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {t("steam.logTitle")}
          </Typography>
          <Box
            ref={logBoxRef}
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              maxHeight: 200,
              overflow: "auto",
              borderRadius: 1.5,
              border: "1px solid rgba(128,128,128,0.4)",
              fontFamily:
                '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
              fontSize: 11,
              lineHeight: 1.4,
              bgcolor: "rgba(0,0,0,0.25)",
              color: "inherit",
              ...CLEAN_SCROLLBAR_SX,
            }}
          >
            {lines.join("\n")}
          </Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <LinearProgress
              sx={{ flexGrow: 1, height: 8, borderRadius: 999 }}
              variant={percent === null ? "indeterminate" : "determinate"}
              value={percent ?? 0}
            />
            <Typography
              variant="body2"
              sx={{
                minWidth: 56,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {percent === null
                ? "…"
                : `${percent.toFixed(percent >= 100 ? 0 : 2)} %`}
            </Typography>
          </Stack>
        </Stack>
      )}
      {error && (
        <Alert severity="error" variant="outlined" sx={{ mt: 2, color: "inherit" }}>
          {error}
        </Alert>
      )}
    </Box>
  );

  const buttons: PopupButton[] = [
    ...(issue?.depotAvailable
      ? [
          {
            text: depotRunning
              ? t("steam.cancelDepot")
              : t(issue.depotOnly ? "steam.depotOnly" : "steam.depot"),
            action: depotRunning ? cancelDepot : askDepot,
            variant: "main" as const,
          },
        ]
      : []),
    ...(issue?.depotOnly
      ? []
      : [
          {
            text: t("steam.pick"),
            action: pickFolder,
            variant: "secondary" as const,
            disabled: depotRunning,
          },
        ]),
    {
      text: t("steam.retry"),
      action: retry,
      variant: "secondary",
      disabled: depotRunning,
    },
    {
      // Pendant un téléchargement, fermer masque seulement le popup : le bouton principal le rouvre
      text: depotRunning ? t("steam.hide") : t("common.close"),
      action: onClose,
      variant: "secondary",
    },
  ];

  const infoMessage = info && (
    <Box sx={{ textAlign: "left", maxHeight: "52vh", overflowY: "auto", ...CLEAN_SCROLLBAR_SX }}>
      <SimpleMarkdown
        source={[
          t("steam.info.what"),
          t("steam.info.source", { url: info.sourceUrl }),
          `## ${t("steam.info.title")}`,
          t("steam.info.step1", {
            version: info.version || t("steam.info.notConfigured"),
            dir: info.toolsDir,
          }),
          t("steam.info.step2"),
          t("steam.info.step3", { dir: info.downloadDir }),
          t("steam.info.step4"),
          t("steam.info.cancel"),
        ].join("\n")}
      />
    </Box>
  );

  return (
    <>
      <Popup
        open={open && issue !== null}
        onClose={onClose}
        type={error ? "error" : "warning"}
        title={t("steam.dialogTitle")}
        message={content}
        buttons={buttons}
      />
      <Popup
        open={info !== null}
        onClose={() => setInfo(null)}
        type="info"
        title={t("steam.infoTitle")}
        message={infoMessage}
        buttons={[
          { text: t("steam.infoContinue"), action: acceptInfo, variant: "main" },
          { text: t("common.cancel"), action: () => setInfo(null), variant: "secondary" },
        ]}
      />
    </>
  );
}
