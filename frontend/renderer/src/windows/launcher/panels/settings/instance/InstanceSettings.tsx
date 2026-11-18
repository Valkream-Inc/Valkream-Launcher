/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Panneau de réglages générique d'une instance (remplace un panneau par jeu) :
 * General (réglages propres au jeu), Mods (joueur), Debug (admin).
 */

import { useEffect, useState } from "react";
import { Typography } from "@mui/material";

import type { Channel, InstanceSettingValue } from "@shared/types";

import instancesRenderConfig from "../../../../../instances/instances.config";
import { pickChannel } from "../../../../../instances/instances.helpers";
import { NavButton, NavSettings } from "../component/nav-settings/nav-settings";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTab from "../component/settings-tab/settings-tab";
import SettingsTitle from "../component/settings-tittle/settings-title";
import type { GameSettingsProps } from "../settings.types";
import InstanceCustomSettings from "./InstanceCustomSettings";
import InstanceDebugTab from "./InstanceDebugTab";
import InstanceModsTab from "./InstanceModsTab";
import { useInstanceReport } from "./use-instance-report";

interface Props extends GameSettingsProps {
  instanceId: string;
}

export default function InstanceSettings({
  instanceId,
  returnToHome,
  changeTab,
  activeTab,
  ToggleIsConfirmSpecialOptionVisible,
  isSpecialOptionVisible,
  isDevActive,
}: Props) {
  const renderConfig = instancesRenderConfig.find((item) => item.id === instanceId);
  const [channel, setChannel] = useState<Channel>("stable");
  const [values, setValues] = useState<Record<string, InstanceSettingValue>>({});
  const { report, loading, error, reload } = useInstanceReport(instanceId, channel);
  const isAdmin = isDevActive || isSpecialOptionVisible;

  // Canal : beta seulement si activée dans le launcher ET proposée par le remote.
  useEffect(() => {
    void (async () => {
      const [betaEnabled, instances] = await Promise.all([
        window.electron_API.getSettings("betaEnabled"),
        window.electron_API.getInstances(),
      ]);
      const summary = instances.find((item) => item.id === instanceId);
      setChannel(pickChannel(betaEnabled, summary?.channels ?? []));
    })().catch(console.error);
  }, [instanceId]);

  useEffect(() => {
    if (report) setValues(report.settings);
  }, [report]);

  if (!renderConfig) {
    return <SettingsBox warn={true} text={`Instance « ${instanceId} » sans config render.`} />;
  }

  return (
    <>
      <NavSettings
        onSave={returnToHome}
        activeTab={activeTab}
        onToogleSpecialOption={ToggleIsConfirmSpecialOptionVisible}
        setActiveTab={changeTab}
      >
        <NavButton id="general" label="General" active={false} />
        <NavButton id="mods" label="Mods" active={false} />
        {isAdmin && <NavButton id="dev" label="Debug" active={false} />}
      </NavSettings>

      <SettingsTab id="general" activeTab={activeTab}>
        <SettingsTitle warn={false}>
          {renderConfig.name}
          {channel === "beta" && " (beta)"}
        </SettingsTitle>
        {renderConfig.descriptionContent}
        {error && <Typography color="error">{error}</Typography>}
        {renderConfig.customGamesSettings && (
          <InstanceCustomSettings
            id={instanceId}
            channel={channel}
            settings={renderConfig.customGamesSettings}
            values={values}
            onChange={(next) => {
              setValues(next);
              void reload(); // une entrée `optional` peut avoir changé d'état
            }}
          />
        )}
      </SettingsTab>

      <SettingsTab id="mods" activeTab={activeTab}>
        {loading && !report && <Typography>Chargement…</Typography>}
        {report && <InstanceModsTab report={report} />}
      </SettingsTab>

      {isAdmin && (
        <SettingsTab id="dev" activeTab={activeTab}>
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
