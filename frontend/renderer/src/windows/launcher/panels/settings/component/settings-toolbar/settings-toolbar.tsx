/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Barre d'outils des réglages : actualiser et zoom (− / + / 100 %, aussi Ctrl + molette).
 * Le zoom est conservé entre deux lancements.
 */

import "./settings-toolbar.css";

import RefreshIcon from "@mui/icons-material/Refresh";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import { CircularProgress, IconButton, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "./zoom";

interface Props {
  zoom: number;
  onZoom: (next: number) => void;
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
}

export default function SettingsToolbar({ zoom, onZoom, onRefresh, refreshing }: Props) {
  const { t } = useTranslation();
  return (
    <div className="settings-toolbar" role="toolbar" aria-label={t("toolbar.label")}>
      <Tooltip title={t("toolbar.refresh")}>
        <span>
          <IconButton size="small" color="inherit" disabled={refreshing} onClick={() => void onRefresh()} aria-label={t("toolbar.refresh")}>
            {refreshing ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t("toolbar.zoomOut")}>
        <span>
          <IconButton size="small" color="inherit" disabled={zoom <= MIN_ZOOM} onClick={() => onZoom(zoom - ZOOM_STEP)} aria-label={t("toolbar.zoomOut")}>
            <RemoveIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={t("toolbar.zoomReset")}>
        <span className="zoom-value" role="button" tabIndex={0} onClick={() => onZoom(1)} onKeyDown={(event) => event.key === "Enter" && onZoom(1)} style={{ cursor: "pointer" }}>
          {Math.round(zoom * 100)} %
        </span>
      </Tooltip>
      <Tooltip title={t("toolbar.zoomIn")}>
        <span>
          <IconButton size="small" color="inherit" disabled={zoom >= MAX_ZOOM} onClick={() => onZoom(zoom + ZOOM_STEP)} aria-label={t("toolbar.zoomIn")}>
            <AddIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
}
