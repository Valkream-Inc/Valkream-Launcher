/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Panneau de réglages générique d'une instance (remplace un panneau par jeu) :
 * General, Launcher, Game (réglages décrits par la config render), Mods (affichage
 * joueur), Dev (outils du jeu), Tools (préparation du remote) et Debug (diagnostic admin : un tableau par sous-chemin).
 */

import { Typography } from "@mui/material";
import { Fragment, useEffect, useRef, useState } from "react";

import type { InstanceId } from "@shared/types";

import { useTranslation } from "react-i18next";
import { instanceText } from "../../../../../i18n";
import instancesRenderConfig from "../../../../../instances/instances.config";
import { useAction } from "../../../context/action.context";
import { useGames } from "../../../context/games.context";
import { NavButton, NavSettings } from "../component/nav-settings/nav-settings";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTab from "../component/settings-tab/settings-tab";
import SettingsTitle from "../component/settings-title/settings-title";
import SettingsToolbar from "../component/settings-toolbar/settings-toolbar";
import {
  clampZoom,
  loadZoom,
  saveZoom,
  ZOOM_STEP,
} from "../component/settings-toolbar/zoom";
import ButtonDebug from "../settings-list/global/button-debug";
import ButtonOpenAppData from "../settings-list/global/button-open-appdata";
import ButtonUninstallGlobal from "../settings-list/global/button-uninstall-global";
import GamesRootSetting from "../settings-list/global/games-root-setting";
import NexusKeySetting from "../settings-list/global/nexus-key-setting";
import SelectLanguage from "../settings-list/global/select-language";
import SelectLauncherBackgroundType from "../settings-list/global/select-launcher-background-type";
import SelectLauncherTheme from "../settings-list/global/select-launcher-theme";
import ToggleBeta from "../settings-list/global/toggle-beta";
import ToggleDev from "../settings-list/global/toggle-dev";
import ToggleMusic from "../settings-list/global/toggle-music";
import Instance_ButtonOpenGame from "../settings-list/instance/instance-button-open-game";
import Instance_ButtonUninstallGame from "../settings-list/instance/instance-button-uninstall-game";
import Instance_CustomSettings, {
  hasCustomSettings,
} from "../settings-list/instance/instance-custom-settings";
import Instance_SelectLauncherBehavior from "../settings-list/instance/instance-select-launcher-behavior";
import type { InstanceSettingValues } from "../settings-list/instance/instance-setting.types";
import Instance_ToggleLaunchSteam from "../settings-list/instance/instance-toggle-launch-steam";
import type { GameSettingsProps } from "../settings.types";
import InstanceContributorsTab from "./InstanceContributorsTab";
import InstanceDebugTab from "./InstanceDebugTab";
import InstanceModsTab from "./InstanceModsTab";
import InstanceToolsTab from "./InstanceToolsTab";
import { useInstanceReport } from "./use-instance-report";

interface Props extends GameSettingsProps {
  instanceId: InstanceId;
}

export default function InstanceSettings({
  instanceId,
  returnToHome,
  changeTab,
  activeTab,
  ToggleIsConfirmAdminVisible,
  isAdminActive,
  setIsDevActive,
  isDevActive,
}: Props) {
  const { t } = useTranslation();
  const { actualChannel: channel } = useGames();
  const { actionLoading } = useAction();
  const renderConfig = instancesRenderConfig.find(
    (item) => item.id === instanceId,
  );
  const [values, setValues] = useState<InstanceSettingValues>({});
  const { report, loading, error, reload } = useInstanceReport(
    instanceId,
    channel,
  );
  const isSpecialActive = isDevActive || isAdminActive;

  // Zoom des réglages : variable CSS sur le document, conservée entre deux lancements ; Ctrl + molette
  const [zoom, setZoomState] = useState(loadZoom);
  const setZoom = (next: number) => {
    const value = clampZoom(next);
    setZoomState(value);
    saveZoom(value);
  };
  useEffect(() => {
    document.documentElement.style.setProperty("--settings-zoom", String(zoom));
    return () => {
      document.documentElement.style.removeProperty("--settings-zoom");
    };
  }, [zoom]);
  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      setZoomState((current) => {
        const value = clampZoom(
          current + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
        );
        saveZoom(value);
        return value;
      });
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);
  const customSettings = renderConfig?.customGamesSettings ?? [];
  // Titre « options avancées » : seulement s'il y a au moins un réglage à montrer à ce niveau d'accès
  const hasAdvancedOptions = (["dev", "special", "admin"] as const).some(
    (level) =>
      ((level === "dev" && isDevActive) ||
        (level === "special" && isSpecialActive) ||
        (level === "admin" && isAdminActive)) &&
      (hasCustomSettings(customSettings, level, "normal") ||
        hasCustomSettings(customSettings, level, "danger")),
  );

  // Les réglages viennent du rapport au premier chargement de chaque instance / canal seulement :
  // ensuite l'état local fait foi (sinon un rechargement en retard écrase le réglage qu'on vient de changer).
  const loadedKey = useRef<string | null>(null);
  useEffect(() => {
    const key = `${instanceId}@${channel}`;
    if (report && loadedKey.current !== key) {
      loadedKey.current = key;
      setValues(report.settings);
    }
  }, [report, instanceId, channel]);

  // Pendant une action (installation…), on ne reste pas sur les onglets qui modifient le jeu
  useEffect(() => {
    if (actionLoading && ["tools", "debug"].includes(activeTab))
      changeTab("general");
  }, [actionLoading]);

  if (!renderConfig) {
    return (
      <SettingsBox
        warn={true}
        text={t("instance.noConfig", { id: instanceId })}
      />
    );
  }

  const settingProps = {
    id: instanceId,
    channel,
    values,
    onChange: (next: InstanceSettingValues) => {
      setValues(next);
      void reload({ silent: true }); // une entrée `optional` peut avoir changé d'état
    },
  };

  return (
    <>
      {/* Navs */}
      <NavSettings
        onSave={returnToHome}
        activeTab={activeTab}
        ToggleIsConfirmAdminVisible={ToggleIsConfirmAdminVisible}
        setActiveTab={changeTab}
        ToolBar={
          <SettingsToolbar
            zoom={zoom}
            onZoom={setZoom}
            onRefresh={() => reload({ verify: false })}
            refreshing={loading}
          />
        }
      >
        <NavButton id="general" label="General" active={false} />
        <NavButton id="launcher" label="Launcher" active={false} />
        <NavButton id="game" label="Game" active={false} />
        <NavButton id="mods" label="Mods" active={false} />
        <NavButton
          id="contributors"
          label={t("instance.contributorsTab")}
          active={false}
        />
        {isDevActive && <NavButton id="dev" label="Dev" active={false} />}
        {!actionLoading && isAdminActive && (
          <NavButton id="tools" label="Tools" active={false} />
        )}
        {!actionLoading && isDevActive && (
          <NavButton id="debug" label="Debug" active={false} />
        )}
      </NavSettings>

      {/* Tabs */}
      <SettingsTab id="general" activeTab={activeTab}>
        <SettingsTitle
          warn={false}
          scope="game"
          scopeDetail={channel !== "stable" ? channel : undefined}
        >
          General
        </SettingsTitle>
        {(renderConfig.description || renderConfig.descriptionContent) && (
          <SettingsBox warn={false}>
            {renderConfig.description && (
              <ul>
                {renderConfig.description.map((item, index) => (
                  <li key={index}>{instanceText(instanceId, item)}</li>
                ))}
              </ul>
            )}
            {renderConfig.descriptionContent}
          </SettingsBox>
        )}
        <SettingsTitle warn={false} scope="advanced">
          {t("instance.advancedMode")}
        </SettingsTitle>
        <ToggleDev
          devActive={isDevActive}
          setDevActive={setIsDevActive}
          setTab={changeTab}
        />
        {!actionLoading && (
          <>
            <SettingsTitle warn={true} scope="global">
              {t("instance.dangerZone")}
            </SettingsTitle>
            <ButtonUninstallGlobal />
          </>
        )}
      </SettingsTab>

      <SettingsTab id="launcher" activeTab={activeTab}>
        <SettingsTitle warn={false} scope="global">
          Launcher
        </SettingsTitle>
        <ToggleMusic />
        <SelectLanguage />
        <SelectLauncherTheme />
        <SelectLauncherBackgroundType />
        {!actionLoading && <GamesRootSetting />}
        {!actionLoading && <ToggleBeta />}

        {isAdminActive && (
          <>
            <SettingsTitle warn={true} scope="global">
              {t("instance.dangerZone")}
            </SettingsTitle>
            <NexusKeySetting />
          </>
        )}
      </SettingsTab>

      <SettingsTab id="game" activeTab={activeTab}>
        <SettingsTitle
          warn={false}
          scope="game"
          scopeDetail={channel !== "stable" ? channel : undefined}
        >
          Game
        </SettingsTitle>
        {error && <Typography color="error">{error}</Typography>}
        <Instance_ToggleLaunchSteam
          {...settingProps}
          steamAppId={report?.steamAppId}
        />
        <Instance_SelectLauncherBehavior {...settingProps} />
        {!actionLoading && (
          <>
            <Instance_CustomSettings
              {...settingProps}
              settings={customSettings}
              level="normal"
              zone="normal"
            />
            {hasCustomSettings(customSettings, "normal", "danger") && (
              <SettingsTitle warn={true} scope="game">
                {t("instance.dangerZone")}
              </SettingsTitle>
            )}
            <Instance_CustomSettings
              {...settingProps}
              settings={customSettings}
              level="normal"
              zone="danger"
            />
          </>
        )}

        {/* Options du jeu réservées au dev / admin */}
        {!actionLoading && hasAdvancedOptions && (
          <>
            <SettingsTitle warn={false} scope="advanced">
              {t("instance.advancedGameOptions")}
            </SettingsTitle>
            {(["dev", "special", "admin"] as const).map(
              (level) =>
                ((level === "dev" && isDevActive) ||
                  (level === "special" && isSpecialActive) ||
                  (level === "admin" && isAdminActive)) && (
                  <Fragment key={level}>
                    <Instance_CustomSettings
                      {...settingProps}
                      settings={customSettings}
                      level={level}
                      zone="normal"
                    />
                    <Instance_CustomSettings
                      {...settingProps}
                      settings={customSettings}
                      level={level}
                      zone="danger"
                    />
                  </Fragment>
                ),
            )}
          </>
        )}
      </SettingsTab>

      <SettingsTab id="mods" activeTab={activeTab} isScrollable={false}>
        {loading && !report && <Typography>{t("common.loading")}</Typography>}
        {report && <InstanceModsTab report={report} />}
      </SettingsTab>

      <SettingsTab id="contributors" activeTab={activeTab} isScrollable={false}>
        {loading && !report && <Typography>{t("common.loading")}</Typography>}
        {report && <InstanceContributorsTab report={report} />}
      </SettingsTab>

      {/* Dev : outils d'administration */}
      <SettingsTab id="dev" activeTab={activeTab}>
        <SettingsTitle warn={true} scope="advanced">
          Dev
        </SettingsTitle>
        {!actionLoading && (
          <Instance_ButtonUninstallGame
            id={instanceId}
            channel={channel}
            onDone={reload}
          />
        )}
        {!actionLoading && (
          <Instance_ButtonOpenGame id={instanceId} channel={channel} />
        )}
        <ButtonOpenAppData />
        <ButtonDebug />
      </SettingsTab>

      {/* Tools : outils de préparation du remote (hash de dossier, liste de mods) */}
      <SettingsTab id="tools" activeTab={activeTab}>
        <InstanceToolsTab />
      </SettingsTab>

      {/* Debug : diagnostic de l'installation (rapport, tableaux, journal) */}
      <SettingsTab id="debug" activeTab={activeTab}>
        {!report && loading && <Typography>{t("common.loading")}</Typography>}
        {report && (
          <InstanceDebugTab
            report={report}
            debugContent={renderConfig.debugContent}
            loading={loading}
            onReload={reload}
            changeTab={changeTab}
          />
        )}
      </SettingsTab>
    </>
  );
}
