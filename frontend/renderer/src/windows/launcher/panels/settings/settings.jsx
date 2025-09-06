import { useState } from "react";
import {
  NavButton,
  NavSettings,
} from "./component/nav-settings/nav-settings.jsx";
import SettingsTab from "./component/settings-tab/settings-tab.jsx";
import SettingsTitle from "./component/settings-tittle/settings-title.jsx";
import SettingsBox from "./component/settings-box/settings-box.jsx";
import { enqueueSnackbar } from "notistack";

import ToggleMusic from "./settings-list/toggle-music.jsx";
import ToggleDev from "./settings-list/toggle-dev.jsx";
import ToggleBeta from "./settings-list/toggle-beta.jsx";
import ToggleLaunchSteam from "./settings-list/toggle-launch-steam.jsx";
import ToggleBoostFPS from "./settings-list/toggle-boostfps.jsx";
import ToggleAdmin from "./settings-list/toggle-admin.jsx";
import SelectLauncherTheme from "./settings-list/select-launcher-theme.jsx";
import SelectLauncherBehavior from "./settings-list/select-launcher-behavior.jsx";
import ButtonUninstallGlobal from "./settings-list/button-uninstall-global.jsx";
import ButtonUninstallGame from "./settings-list/button-uninstall-game.jsx";
import ButtonOpenGame from "./settings-list/button-open-game.jsx";
import ButtonOpenAppData from "./settings-list/button-open-appdata.jsx";
import ButtonDebug from "./settings-list/button-debug.jsx";

function Presentation() {
  return (
    <SettingsBox warn={false} className="settings-elements-box">
      Le partage et l’entraide sont des mots clés qui définissent bien l’esprit
      de la communauté Valkream.
      <br />
      Le respect de l’idéologie des développeurs originaux est une priorité.
      <br />
      Le mode pack est essentiellement constitué de mécaniques additionnelles,
      de nouvelles créatures, d’armures, d’armes et tous les biomes sont
      fonctionnels.
      <br />
      Le mode pack Valkream est jouable en partie privée, serveur privée ou
      serveur Valkream.
      <br />
      Garantissant une expérience complète et sans fin.
      <br />
    </SettingsBox>
  );
}

function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSpecialOptionVisible, setIsSpecialOptionVisible] = useState(false);
  const [isDevActive, setIsDevActive] = useState(false);

  const toogleSpecialOption = () => {
    enqueueSnackbar(
      isSpecialOptionVisible
        ? "Options Speciales désactivées !"
        : "Options Speciales activées !",
      { variant: "warning" }
    );
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
        <Presentation />
        <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
        <ButtonUninstallGlobal />
        {isSpecialOptionVisible && (
          <ToggleDev
            devActive={isDevActive}
            setDevActive={setIsDevActive}
            setTab={setActiveTab}
          />
        )}
      </SettingsTab>

      <SettingsTab id="launcher" activeTab={activeTab}>
        <SettingsTitle warn={false}>Launcher</SettingsTitle>
        <ToggleMusic />
        <SelectLauncherBehavior />
        {isSpecialOptionVisible && <SelectLauncherTheme />}
      </SettingsTab>

      <SettingsTab id="game" activeTab={activeTab}>
        <SettingsTitle warn={false}>Game</SettingsTitle>
        <ToggleLaunchSteam />
        <ToggleBoostFPS />
        {isSpecialOptionVisible && (
          <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
        )}
        {isSpecialOptionVisible && <ToggleAdmin />}
      </SettingsTab>

      <SettingsTab id="mods" activeTab={activeTab}>
        <SettingsTitle warn={false}>Mods</SettingsTitle>
      </SettingsTab>

      {isSpecialOptionVisible && isDevActive && (
        <SettingsTab id="dev" activeTab={activeTab}>
          <SettingsTitle warn={true}>Dev / Debug</SettingsTitle>
          <ButtonUninstallGame />
          <ButtonOpenGame />
          <ButtonOpenAppData />
          <SettingsTitle warn={true}> ⚠️ Advanced !</SettingsTitle>
          <ButtonDebug />
          <ToggleBeta />
        </SettingsTab>
      )}
    </>
  );
}

export default Settings;
