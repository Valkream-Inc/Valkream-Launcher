/**
 * @author Valkream Team
 * @license MIT-NC
 */

import {
  NavButton,
  NavSettings,
} from "../components/nav-settings/nav-settings.jsx";
import SettingsBox from "../components/settings-box/settings-box.jsx";
import SettingsTab from "../components/settings-tab/settings-tab.js";
import SettingsTitle from "../components/settings-tittle/settings-title.js";

import ButtonDebug from "../settings-list/global/button-debug.jsx";
import ButtonOpenAppData from "../settings-list/global/button-open-appdata.jsx";
import ButtonUninstallGlobal from "../settings-list/global/button-uninstall-global.jsx";
import SelectLauncherBackgroundType from "../settings-list/global/select-launcher-background-type.jsx";
import SelectLauncherTheme from "../settings-list/global/select-launcher-theme.jsx";
import ToggleBeta from "../settings-list/global/toggle-beta.jsx";
import ToggleDev from "../settings-list/global/toggle-dev.jsx";
import ToggleMusic from "../settings-list/global/toggle-music.jsx";

import SevenDtoD_ButtonOpenGame from "../settings-list/SevenDtoD/SevenDtoD-button-open-game.jsx";
import SevenDtoD_ButtonUninstallGame from "../settings-list/SevenDtoD/SevenDtoD-button-uninstall-game.jsx";
import SevenDtoD_ChooseCustomGamePath from "../settings-list/SevenDtoD/SevenDtoD-choose-custom-game-path.jsx";
import SecenDtoD_ModsTab from "./SecenDtoD-mods-tab.jsx";

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
          Le développement est assuré par des bénévoles sur leur temps
          personnel. Le respect de l’idéologie des développeurs originaux est
          une priorité.
        </li>
        <br />
        <li>
          Le modpack 7days to Valkream est essentiellement constitué de
          mécaniques additionnelles, de nouvelles créatures, d’armures, d’armes
          et tous les biomes sont fonctionnels.
        </li>
        <br />
        <li>
          La difficulté est aussi augmentée et évolutive, garantissant une
          expérience plus difficile, complète et sans fin.
        </li>
        <br />
        <li>
          Pour y accéder, connectez-vous au serveur Valkream. Via votre Steam ou
          via notre Launcher.
        </li>
        <br />
      </ul>
    </SettingsBox>
  );
}

function SevenDtoDSettings({
  returnToHome,
  modsTabRef,
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
        <SelectLauncherTheme />
        <SelectLauncherBackgroundType />
      </SettingsTab>

      <SettingsTab id="game" activeTab={activeTab}>
        <SettingsTitle warn={false}>Game</SettingsTitle>
        <SevenDtoD_ChooseCustomGamePath />
      </SettingsTab>

      {isSpecialOptionVisible && (
        <SettingsTab id="mods" activeTab={activeTab}>
          <SettingsTitle warn={false}>Mods</SettingsTitle>
          <SecenDtoD_ModsTab
            ref={modsTabRef}
            isDevActive={isDevActive || isSpecialOptionVisible}
          />
        </SettingsTab>
      )}

      {(isDevActive || isSpecialOptionVisible) && (
        <SettingsTab id="dev" activeTab={activeTab}>
          <SettingsTitle warn={true}>Dev / Debug</SettingsTitle>
          <SevenDtoD_ButtonUninstallGame />
          <SevenDtoD_ButtonOpenGame />

          <ButtonOpenAppData />
          <SettingsTitle warn={true}> ⚠️ Advanced !</SettingsTitle>
          <ButtonDebug />
          {isSpecialOptionVisible && <ToggleBeta />}
        </SettingsTab>
      )}
    </>
  );
}

export default SevenDtoDSettings;
