/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Panneau de réglages générique d'une instance (remplace un panneau par jeu) :
 * General, Launcher, Game (réglages décrits par la config render), Mods (affichage
 * joueur), Dev (outils admin) et Debug (diagnostic admin : un tableau par sous-chemin).
 */

import { useEffect, useRef, useState } from "react";
import { Typography } from "@mui/material";

import type { InstanceId } from "@shared/types";

import instancesRenderConfig from "../../../../../instances/instances.config";
import { useAction } from "../../../context/action.context";
import { useGames } from "../../../context/games.context";
import { NavButton, NavSettings } from "../component/nav-settings/nav-settings";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTab from "../component/settings-tab/settings-tab";
import SettingsTitle from "../component/settings-title/settings-title";
import ButtonDebug from "../settings-list/global/button-debug";
import ButtonOpenAppData from "../settings-list/global/button-open-appdata";
import ButtonUninstallGlobal from "../settings-list/global/button-uninstall-global";
import SelectLauncherBackgroundType from "../settings-list/global/select-launcher-background-type";
import SelectLauncherTheme from "../settings-list/global/select-launcher-theme";
import ToggleBeta from "../settings-list/global/toggle-beta";
import ToggleDev from "../settings-list/global/toggle-dev";
import ToggleMusic from "../settings-list/global/toggle-music";
import Instance_ButtonOpenGame from "../settings-list/instance/instance-button-open-game";
import Instance_ButtonUninstallGame from "../settings-list/instance/instance-button-uninstall-game";
import Instance_CustomSettings from "../settings-list/instance/instance-custom-settings";
import Instance_SelectLauncherBehavior from "../settings-list/instance/instance-select-launcher-behavior";
import type { InstanceSettingValues } from "../settings-list/instance/instance-setting.types";
import Instance_ToggleLaunchSteam from "../settings-list/instance/instance-toggle-launch-steam";
import type { GameSettingsProps } from "../settings.types";
import InstanceDebugTab from "./InstanceDebugTab";
import InstanceModsTab from "./InstanceModsTab";
import { useInstanceReport } from "./use-instance-report";

interface Props extends GameSettingsProps {
  instanceId: InstanceId;
}

export default function InstanceSettings({
  instanceId,
  returnToHome,
  changeTab,
  activeTab,
  ToggleIsConfirmSpecialOptionVisible,
  isSpecialOptionVisible,
  setIsDevActive,
  isDevActive,
}: Props) {
  const { actualChannel: channel } = useGames();
  const { actionLoading } = useAction();
  const renderConfig = instancesRenderConfig.find((item) => item.id === instanceId);
  const [values, setValues] = useState<InstanceSettingValues>({});
  const { report, loading, error, reload } = useInstanceReport(instanceId, channel);
  const isAdmin = isDevActive || isSpecialOptionVisible;
  const customSettings = renderConfig?.customGamesSettings ?? [];

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
    if (actionLoading && ["mods", "dev", "debug"].includes(activeTab)) changeTab("general");
  }, [actionLoading]);

  if (!renderConfig) {
    return <SettingsBox warn={true} text={`Instance « ${instanceId} » sans config render.`} />;
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
        onToogleSpecialOption={ToggleIsConfirmSpecialOptionVisible}
        setActiveTab={changeTab}
      >
        <NavButton id="general" label="General" active={false} />
        <NavButton id="launcher" label="Launcher" active={false} />
        <NavButton id="game" label="Game" active={false} />
        {!actionLoading && <NavButton id="mods" label="Mods" active={false} />}
        {isAdmin && <NavButton id="dev" label="Dev" active={false} />}
        {isAdmin && <NavButton id="debug" label="Debug" active={false} />}
      </NavSettings>

      {/* Tabs */}
      <SettingsTab id="general" activeTab={activeTab}>
        <SettingsTitle warn={false}>
          General{channel === "beta" && " (beta)"}
        </SettingsTitle>
        {renderConfig.descriptionContent && (
          <SettingsBox warn={false}>{renderConfig.descriptionContent}</SettingsBox>
        )}
        <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
        {!actionLoading && <ButtonUninstallGlobal />}
        <ToggleDev
          devActive={isDevActive}
          setDevActive={setIsDevActive}
          setTab={changeTab}
        />
      </SettingsTab>

      <SettingsTab id="launcher" activeTab={activeTab}>
        <SettingsTitle warn={false}>Launcher</SettingsTitle>
        <ToggleMusic />
        <SelectLauncherTheme />
        <SelectLauncherBackgroundType />
      </SettingsTab>

      <SettingsTab id="game" activeTab={activeTab}>
        <SettingsTitle warn={false}>Game</SettingsTitle>
        {error && <Typography color="error">{error}</Typography>}
        <Instance_ToggleLaunchSteam {...settingProps} />
        <Instance_SelectLauncherBehavior {...settingProps} />
        {!actionLoading && (
          <Instance_CustomSettings {...settingProps} settings={customSettings} level="normal" />
        )}
        {!actionLoading && isSpecialOptionVisible && (
          <Instance_CustomSettings {...settingProps} settings={customSettings} level="special" />
        )}
        {!actionLoading &&
          isSpecialOptionVisible &&
          customSettings.some((setting) => setting.level === "danger") && (
            <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
          )}
        {!actionLoading && isSpecialOptionVisible && (
          <Instance_CustomSettings {...settingProps} settings={customSettings} level="danger" />
        )}
      </SettingsTab>

      <SettingsTab id="mods" activeTab={activeTab}>
        <SettingsTitle warn={false}>Mods</SettingsTitle>
        {loading && !report && <Typography>Chargement…</Typography>}
        {report && <InstanceModsTab report={report} />}
      </SettingsTab>

      {/* Dev : outils d'administration */}
      {isAdmin && (
        <SettingsTab id="dev" activeTab={activeTab}>
          <SettingsTitle warn={true}>Dev</SettingsTitle>
          {!actionLoading && (
            <Instance_ButtonUninstallGame id={instanceId} channel={channel} onDone={reload} />
          )}
          {!actionLoading && <Instance_ButtonOpenGame id={instanceId} channel={channel} />}
          <ButtonOpenAppData />

          <SettingsTitle warn={true}> ⚠️ Advanced !</SettingsTitle>
          <ButtonDebug />
          {!actionLoading && isSpecialOptionVisible && <ToggleBeta />}
        </SettingsTab>
      )}

      {/* Debug : diagnostic de l'installation (rapport, tableaux, journal) */}
      {isAdmin && (
        <SettingsTab id="debug" activeTab={activeTab}>
          {!report && loading && <Typography>Chargement…</Typography>}
          {report && (
            <InstanceDebugTab
              report={report}
              debugContent={renderConfig.debugContent}
              loading={loading}
              onReload={reload}
            />
          )}
        </SettingsTab>
      )}
    </>
  );
}
