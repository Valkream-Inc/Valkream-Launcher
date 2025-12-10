/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import { useRef, useState } from "react";
import SpecialPanel from "../../component/special-panel/special-panel.jsx";
import {
  NavButton,
  NavSettings,
} from "./component/nav-settings/nav-settings.jsx";
import SettingsBox from "./component/settings-box/settings-box.jsx";
import SettingsTab from "./component/settings-tab/settings-tab.jsx";
import SettingsTitle from "./component/settings-tittle/settings-title.jsx";

import ModsTab from "./mods-tab.jsx";
import ButtonDebug from "./settings-list/button-debug.jsx";
import ButtonOpenAppData from "./settings-list/button-open-appdata.jsx";
import ButtonOpenGame from "./settings-list/button-open-game.jsx";
import ButtonUninstallGame from "./settings-list/button-uninstall-game.jsx";
import ButtonUninstallGlobal from "./settings-list/button-uninstall-global.jsx";
import SelectLauncherBackgroundType from "./settings-list/select-launcher-background-type.jsx";
import SelectLauncherBehavior from "./settings-list/select-launcher-behavior.jsx";
import SelectLauncherTheme from "./settings-list/select-launcher-theme.jsx";
import ToggleAdmin from "./settings-list/toggle-admin.jsx";
import ToggleBeta from "./settings-list/toggle-beta.jsx";
import ToggleBoostFPS from "./settings-list/toggle-boostfps.jsx";
import ToggleDev from "./settings-list/toggle-dev.jsx";
import ToggleLaunchSteam from "./settings-list/toggle-launch-steam.jsx";
import ToggleMusic from "./settings-list/toggle-music.jsx";

import { useGames } from "../../context/games.context.jsx";

function Presentation() {
  const { actualGame } = useGames();
  if (actualGame === "Valheim")
    return (
      <SettingsBox warn={false} className="settings-elements-box">
        <ul>
          <li>
            Le partage et l’entraide sont des mots clés qui définissent bien
            l’esprit de la communauté Valkream.
          </li>
          <br />
          <li>
            Le respect de l’idéologie des développeurs originaux est une
            priorité.
          </li>
          <br />
          <li>
            Le mode pack est essentiellement constitué de mécaniques
            additionnelles, de nouvelles créatures, d’armures, d’armes et tous
            les biomes sont fonctionnels.
          </li>
          <br />
          <li>
            Le mode pack Valkream est jouable en partie privée, serveur privée
            ou serveur Valkream.
          </li>
          <br />
          <li>Garantissant une expérience complète et sans fin.</li>
          <br />
        </ul>
      </SettingsBox>
    );
  else if (actualGame === "SevenDtoD")
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
            mécaniques additionnelles, de nouvelles créatures, d’armures,
            d’armes et tous les biomes sont fonctionnels.
          </li>
          <br />
          <li>
            La difficulté est aussi augmentée et évolutive, garantissant une
            expérience plus difficile, complète et sans fin.
          </li>
          <br />
          <li>
            Pour y accéder, connectez-vous au serveur Valkream. Via votre Steam
            ou via notre Launcher.
          </li>
          <br />
        </ul>
      </SettingsBox>
    );
}

function Settings() {
  const { actualGame } = useGames();
  const [activeTab, setActiveTab] = useState("general");
  const [isConfirmSpecialOptionVisible, setIsConfirmSpecialOptionVisible] =
    useState(false);
  const [isSpecialOptionVisible, setIsSpecialOptionVisible] = useState(false);
  const [isDevActive, setIsDevActive] = useState(false);

  const gameTabRef = useRef();

  const toogleSpecialOption = () => {
    enqueueSnackbar(
      isSpecialOptionVisible
        ? "Options Speciales désactivées !"
        : "Options Speciales activées !",
      { variant: "warning" }
    );
    setIsSpecialOptionVisible(!isSpecialOptionVisible);
  };

  const EnabledSpecialOption = () => {
    return (
      <SpecialPanel
        type="warning"
        paragraph="Vous êtes sur le point d’activer des options avancées pouvant endommager votre installation (Admin Tools, Debug Tools, Dev Tools, Fonctionnalités Alpha). Êtes-vous sûr de vouloir continuer ?"
        buttons={[
          {
            text: "Continuer",
            onClick: () => {
              toogleSpecialOption();
              setIsConfirmSpecialOptionVisible(false);
            },
          },
          {
            text: "Annuler et revenir",
            onClick: () => setIsConfirmSpecialOptionVisible(false),
          },
        ]}
      />
    );
  };
  if (isConfirmSpecialOptionVisible) return <EnabledSpecialOption />;

  const changeTab = (tab) => {
    if (gameTabRef.current) {
      gameTabRef.current.stop();
    }

    setActiveTab(tab);

    if (tab === "mods" && gameTabRef.current) {
      gameTabRef.current.reload();
    }
  };

  function returnToHome() {
    if (gameTabRef.current) {
      gameTabRef.current.stop();
      gameTabRef.current.freeze();
    }
  }

  function ToggleIsConfirmSpecialOptionVisible() {
    // si déja activés --> les désactivés
    if (isSpecialOptionVisible) {
      setIsSpecialOptionVisible(false);
      setIsConfirmSpecialOptionVisible(false);
    }
    // sinon rendre visible le panel de confirmation
    else setIsConfirmSpecialOptionVisible(true);
  }

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
        {actualGame === "Valheim" && (
          <NavButton id="game" label="Game" active={false} />
        )}
        {actualGame === "Valheim" && (
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
        <ButtonUninstallGlobal />
        <ToggleDev
          devActive={isDevActive}
          setDevActive={setIsDevActive}
          setTab={setActiveTab}
        />
      </SettingsTab>

      <SettingsTab id="launcher" activeTab={activeTab}>
        <SettingsTitle warn={false}>Launcher</SettingsTitle>
        <ToggleMusic />
        <SelectLauncherBehavior />
        <SelectLauncherTheme />
        <SelectLauncherBackgroundType />
      </SettingsTab>

      {actualGame === "Valheim" && (
        <SettingsTab id="game" activeTab={activeTab}>
          <SettingsTitle warn={false}>Game</SettingsTitle>
          <ToggleLaunchSteam />
          <ToggleBoostFPS />
          {isSpecialOptionVisible && (
            <SettingsTitle warn={true}>⚠️ Danger zone !</SettingsTitle>
          )}
          {isSpecialOptionVisible && <ToggleAdmin />}
        </SettingsTab>
      )}

      {actualGame === "Valheim" && (
        <SettingsTab id="mods" activeTab={activeTab}>
          <SettingsTitle warn={false}>Mods</SettingsTitle>
          <ModsTab
            ref={gameTabRef}
            isDevActive={isDevActive || isSpecialOptionVisible}
          />
        </SettingsTab>
      )}

      {(isDevActive || isSpecialOptionVisible) && (
        <SettingsTab id="dev" activeTab={activeTab}>
          <SettingsTitle warn={true}>Dev / Debug</SettingsTitle>
          {actualGame === "Valheim" && (
            <>
              <ButtonUninstallGame />
              <ButtonOpenGame />
            </>
          )}
          <ButtonOpenAppData />
          <SettingsTitle warn={true}> ⚠️ Advanced !</SettingsTitle>
          <ButtonDebug />
          {isSpecialOptionVisible && actualGame === "Valheim" && <ToggleBeta />}
        </SettingsTab>
      )}
    </>
  );
}

export default Settings;
