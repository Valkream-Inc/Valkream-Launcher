import { useState } from "react";
import {
  NavButton,
  NavSettings,
} from "./component/nav-settings/nav-settings.jsx";
import SettingsTab from "./component/settings-tab/settings-tab.jsx";
import { SettingsTitle } from "./component/settings-tittle/settings-title.jsx";

import ToggleMusic from "./settings-list/toggle-music.jsx";
import ToggleDev from "./settings-list/toggle-dev.jsx";
import ToggleBeta from "./settings-list/toggle-beta.jsx";
import ToggleLaunchSteam from "./settings-list/toggle-launch-steam.jsx";
import ToggleBoostFPS from "./settings-list/toggle-boostfps.jsx";
import ToggleAdmin from "./settings-list/toggle-admin.jsx";
import SelectLauncherTheme from "./settings-list/select-launcher-theme.jsx";

function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSpecialOptionVisible, setIsSpecialOptionVisible] = useState(false);
  const [isDevActive, setIsDevActive] = useState(false);

  const toogleSpecialOption = () => {
    setIsSpecialOptionVisible(!isSpecialOptionVisible);
  };

  const onSave = () => {};

  return (
    <>
      {/* Navs */}
      <NavSettings
        onSave={onSave}
        activeTab={activeTab}
        onToogleSpecialOption={toogleSpecialOption}
        setActiveTab={setActiveTab}
      >
        <NavButton
          id="general"
          label="General"
          active={false}
          onClick={() => {}}
        />
        <NavButton
          id="launcher"
          label="Launcher"
          active={false}
          onClick={() => {}}
        />
        <NavButton id="game" label="Game" active={false} onClick={() => {}} />
        <NavButton id="mods" label="Mods" active={false} onClick={() => {}} />
        {isSpecialOptionVisible && isDevActive && (
          <NavButton id="dev" label="Dev" active={false} onClick={() => {}} />
        )}
      </NavSettings>

      {/* Tabs */}
      <SettingsTab id="general" activeTab={activeTab}>
        <SettingsTitle warn={false}>General</SettingsTitle>
        {isSpecialOptionVisible && (
          <ToggleDev devActive={isDevActive} setDevActive={setIsDevActive} />
        )}
      </SettingsTab>

      <SettingsTab id="launcher" activeTab={activeTab}>
        <SettingsTitle warn={false}>Launcher</SettingsTitle>
        <ToggleMusic />
        {isSpecialOptionVisible && <SelectLauncherTheme />}
      </SettingsTab>

      <SettingsTab id="game" activeTab={activeTab}>
        <SettingsTitle warn={false}>Game</SettingsTitle>
        <ToggleLaunchSteam />
        <ToggleBoostFPS />
        {isSpecialOptionVisible && <ToggleAdmin />}
      </SettingsTab>

      <SettingsTab id="mods" activeTab={activeTab}>
        <SettingsTitle warn={false}>Mods</SettingsTitle>
      </SettingsTab>

      {isSpecialOptionVisible && isDevActive && (
        <SettingsTab id="dev" activeTab={activeTab}>
          <SettingsTitle warn={true}>Dev / Debug</SettingsTitle>
          <ToggleBeta />
        </SettingsTab>
      )}
    </>
  );
}

export default Settings;
