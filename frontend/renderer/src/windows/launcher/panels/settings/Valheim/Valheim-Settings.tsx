/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useEffect } from "react";
import {
  NavButton,
  NavSettings,
} from "../component/nav-settings/nav-settings";
import SettingsBox from "../component/settings-box/settings-box";
import SettingsTab from "../component/settings-tab/settings-tab";
import SettingsTitle from "../component/settings-tittle/settings-title";

import ButtonDebug from "../settings-list/global/button-debug";
import ButtonOpenAppData from "../settings-list/global/button-open-appdata";
import ButtonUninstallGlobal from "../settings-list/global/button-uninstall-global";
import SelectLauncherBackgroundType from "../settings-list/global/select-launcher-background-type";
import SelectLauncherTheme from "../settings-list/global/select-launcher-theme";
import ToggleBeta from "../settings-list/global/toggle-beta";
import ToggleDev from "../settings-list/global/toggle-dev";
import ToggleMusic from "../settings-list/global/toggle-music";

import Valheim_ButtonOpenGame from "../settings-list/Valheim/Valheim-button-open-game";
import Valheim_ButtonUninstallGame from "../settings-list/Valheim/Valheim-button-uninstall-game";
import Valheim_SelectLauncherBehavior from "../settings-list/Valheim/Valheim-select-launcher-behavior";
import Valheim_ToggleAdminMods from "../settings-list/Valheim/Valheim-toggle-admin-mods";
import Valheim_ToggleBoostFpsMods from "../settings-list/Valheim/Valheim-toggle-boostfps-mods";
import Valheim_ToggleBoostGraphicsMods from "../settings-list/Valheim/Valheim-toggle-boostgraphic-mods";
import Valheim_ToggleLaunchSteam from "../settings-list/Valheim/Valheim-toggle-launch-steam";
import Valheim_ModsTab from "./Valheim-mods-tab";

import { useAction } from "../../../context/action.context";

function Presentation() {
  return (
    <SettingsBox warn={false} className="settings-elements-box">
      <ul>
        <li>
          Le partage et l’entraide sont des mots clés qui définissent bien
          l’esprit de la communauté Valkream.
        </li>
        <br />
        <li>
          Le respect de l’idéologie des développeurs originaux est une priorité.
        </li>
        <br />
        <li>
          Le mode pack est essentiellement constitué de mécaniques
          additionnelles, de nouvelles créatures, d’armures, d’armes et tous les
          biomes sont fonctionnels.
        </li>
        <br />
        <li>
          Le mode pack Valkream est jouable en partie privée, serveur privée ou
          serveur Valkream.
        </li>
        <br />
        <li>Garantissant une expérience complète et sans fin.</li>
        <br />
      </ul>
    </SettingsBox>
  );
}

function ValheimSettings({
  returnToHome,
  modsTabRef,
  changeTab,
  activeTab,
  ToggleIsConfirmSpecialOptionVisible,
  isSpecialOptionVisible,
  setIsDevActive,
  isDevActive,
}) {
  const { actionLoading, currentKey } = useAction();

  const isActionAModAction =
    currentKey == "get-mods-data" || currentKey == "get-hash-data";

  useEffect(() => {
    if (actionLoading && activeTab == "mods" && !isActionAModAction)
      changeTab("general");
  }, [actionLoading]);

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
        {(!actionLoading || isActionAModAction) && (
          <NavButton id="mods" label="Mods" active={false} />
        )}

        {(isDevActive || isSpecialOptionVisible) && (
          <NavButton id="dev" label="Dev" active={false} />
        )}
      </NavSettings>

      {/* Tabs */}
      <SettingsTab id="general" activeTab={activeTab}>
        <SettingsTitle warn={false}>General</SettingsTitle>
        <Presentation />
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
        <Valheim_ToggleLaunchSteam />
        <Valheim_SelectLauncherBehavior />
        {!actionLoading && <Valheim_ToggleBoostFpsMods />}
        {!actionLoading && isSpecialOptionVisible && (
          <Valheim_ToggleBoostGraphicsMods />
        )}
        {!actionLoading && isSpecialOptionVisible && (
          <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
        )}
        {!actionLoading && isSpecialOptionVisible && (
          <Valheim_ToggleAdminMods />
        )}
      </SettingsTab>

      <SettingsTab id="mods" activeTab={activeTab}>
        <SettingsTitle warn={false}>Mods</SettingsTitle>
        <Valheim_ModsTab
          ref={modsTabRef}
          isDevActive={isDevActive || isSpecialOptionVisible}
        />
      </SettingsTab>

      {(isDevActive || isSpecialOptionVisible) && (
        <SettingsTab id="dev" activeTab={activeTab}>
          <SettingsTitle warn={true}>Dev / Debug</SettingsTitle>
          {!actionLoading && <Valheim_ButtonUninstallGame />}
          {!actionLoading && <Valheim_ButtonOpenGame />}
          <ButtonOpenAppData />

          <SettingsTitle warn={true}> ⚠️ Advanced !</SettingsTitle>
          <ButtonDebug />
          {!actionLoading && isSpecialOptionVisible && <ToggleBeta />}
        </SettingsTab>
      )}
    </>
  );
}

export default ValheimSettings;
