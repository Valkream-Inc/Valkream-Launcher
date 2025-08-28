import { useState } from "react";
import {
  NavButton,
  NavSettings,
} from "./component/nav-settings/nav-settings.jsx";
import SettingsTab from "./component/settings-tab/settings-tab.jsx";
import { SettingsBox } from "./component/settings-box/settings-box.jsx";
import { SettingsTitle } from "./component/settings-tittle/settings-title.jsx";

import ToggleMusic from "./settings-list/toggle-music.jsx";

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
        <NavButton id="dev" label="Dev" active={false} onClick={() => {}} />
      </NavSettings>

      {/* Tabs */}
      <SettingsTab id="general" activeTab={activeTab}>
        <SettingsTitle warn={false}>General</SettingsTitle>
        <SettingsBox warn={false}>General</SettingsBox>
      </SettingsTab>
      <SettingsTab id="launcher" activeTab={activeTab}>
        <SettingsTitle warn={false}>Launcher</SettingsTitle>
        <ToggleMusic />
      </SettingsTab>
      <SettingsTab id="game" activeTab={activeTab}>
        Game
      </SettingsTab>
      <SettingsTab id="mods" activeTab={activeTab}>
        Mods
      </SettingsTab>
      <SettingsTab id="dev" activeTab={activeTab}>
        Dev
      </SettingsTab>
    </>
  );
}

export default Settings;
