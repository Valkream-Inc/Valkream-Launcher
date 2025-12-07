/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import {
  NavButton,
  NavSettings,
} from "../component/nav-settings/nav-settings.jsx";
import SettingsBox from "../component/settings-box/settings-box.jsx";
import SettingsTab from "../component/settings-tab/settings-tab.jsx";
import SettingsTitle from "../component/settings-tittle/settings-title.jsx";

import ButtonDebug from "../settings-list/global/button-debug.jsx";
import ButtonOpenAppData from "../settings-list/global/button-open-appdata.jsx";
import ButtonOpenGame from "../settings-list/global/button-open-game.jsx";
import ButtonUninstallGame from "../settings-list/global/button-uninstall-game.jsx";
import ButtonUninstallGlobal from "../settings-list/global/button-uninstall-global.jsx";
import SelectLauncherBackgroundType from "../settings-list/global/select-launcher-background-type.jsx";
import SelectLauncherTheme from "../settings-list/global/select-launcher-theme.jsx";
import ToggleBeta from "../settings-list/global/toggle-beta.jsx";
import ToggleDev from "../settings-list/global/toggle-dev.jsx";
import ToggleMusic from "../settings-list/global/toggle-music.jsx";

import Valheim_SelectLauncherBehavior from "../settings-list/Valheim/Valheim-select-launcher-behavior.jsx";
import Valheim_ToggleAdminMods from "../settings-list/Valheim/Valheim-toggle-admin-mods.jsx";
import Valheim_ToggleBoostFpsMods from "../settings-list/Valheim/Valheim-toggle-boostfps-mods.jsx";
import Valheim_ToggleBoostGraphicsMods from "../settings-list/Valheim/Valheim-toggle-boostgraphic-mods.jsx";
import Valheim_ToggleLaunchSteam from "../settings-list/Valheim/Valheim-toggle-launch-steam.jsx";
import Valheim_ModsTab from "./Valheim-mods-tab.jsx";

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
  gameTabRef,
  changeTab,
  activeTab,
  ToggleIsConfirmSpecialOptionVisible,
  isSpecialOptionVisible,
  setIsDevActive,
  isDevActive,
}) {
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
        <NavButton id="mods" label="Mods" active={false} />

        {(isDevActive || isSpecialOptionVisible) && (
          <NavButton id="dev" label="Dev" active={false} />
        )}
      </NavSettings>

      {/* Tabs */}
      <SettingsTab id="general" activeTab={activeTab}>
        <SettingsTitle warn={false}>General</SettingsTitle>
        <Presentation />
        <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
        <ButtonUninstallGlobal />
        <ToggleDev
          devActive={isDevActive}
          setDevActive={setIsDevActive}
          setTab={changeTab}
        />
      </SettingsTab>

      <SettingsTab id="launcher" activeTab={activeTab}>
        <SettingsTitle warn={false}>Launcher</SettingsTitle>
        <ToggleMusic />
        <Valheim_SelectLauncherBehavior />
        <SelectLauncherTheme />
        <SelectLauncherBackgroundType />
      </SettingsTab>

      <SettingsTab id="game" activeTab={activeTab}>
        <SettingsTitle warn={false}>Game</SettingsTitle>
        <Valheim_ToggleLaunchSteam />
        <Valheim_ToggleBoostFpsMods />
        {isSpecialOptionVisible && <Valheim_ToggleBoostGraphicsMods />}
        {isSpecialOptionVisible && (
          <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
        )}
        {isSpecialOptionVisible && <Valheim_ToggleAdminMods />}
      </SettingsTab>

      <SettingsTab id="mods" activeTab={activeTab}>
        <SettingsTitle warn={false}>Mods</SettingsTitle>
        <Valheim_ModsTab
          ref={gameTabRef}
          isDevActive={isDevActive || isSpecialOptionVisible}
        />
      </SettingsTab>

      {(isDevActive || isSpecialOptionVisible) && (
        <SettingsTab id="dev" activeTab={activeTab}>
          <SettingsTitle warn={true}>Dev / Debug</SettingsTitle>
          <ButtonUninstallGame />
          <ButtonOpenGame />

          <ButtonOpenAppData />
          <SettingsTitle warn={true}> ⚠️ Advanced !</SettingsTitle>
          <ButtonDebug />
          {isSpecialOptionVisible && <ToggleBeta />}
        </SettingsTab>
      )}
    </>
  );
}

export default ValheimSettings;
