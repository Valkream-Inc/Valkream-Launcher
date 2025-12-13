/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import { useRef, useState } from "react";
import SpecialPanel from "../../component/special-panel/special-panel.jsx";

import { useGames } from "../../context/games.context.jsx";
import SevenDtoDSettings from "./SevenDtoD/SevenDtoD-Settings.jsx";
import ValheimSettings from "./Valheim/Valheim-Settings.jsx";

function Settings() {
  const { actualGame } = useGames();
  const [activeTab, setActiveTab] = useState("general");
  const [isConfirmSpecialOptionVisible, setIsConfirmSpecialOptionVisible] =
    useState(false);
  const [isSpecialOptionVisible, setIsSpecialOptionVisible] = useState(false);
  const [isDevActive, setIsDevActive] = useState(false);

  const modsTabRef = useRef();

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
    if (modsTabRef.current) {
      modsTabRef.current.stop();
    }

    setActiveTab(tab);

    if (tab === "mods" && modsTabRef.current) {
      modsTabRef.current.reload();
    }
  };

  function returnToHome() {
    if (modsTabRef.current) {
      modsTabRef.current.stop();
      modsTabRef.current.freeze();
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
      {actualGame === "Valheim" && (
        <ValheimSettings
          returnToHome={returnToHome}
          modsTabRef={modsTabRef}
          changeTab={changeTab}
          activeTab={activeTab}
          ToggleIsConfirmSpecialOptionVisible={
            ToggleIsConfirmSpecialOptionVisible
          }
          isSpecialOptionVisible={isSpecialOptionVisible}
          setIsDevActive={setIsDevActive}
          isDevActive={isDevActive}
        />
      )}
      {actualGame === "SevenDtoD" && (
        <SevenDtoDSettings
          returnToHome={returnToHome}
          modsTabRef={modsTabRef}
          changeTab={changeTab}
          activeTab={activeTab}
          ToggleIsConfirmSpecialOptionVisible={
            ToggleIsConfirmSpecialOptionVisible
          }
          isSpecialOptionVisible={isSpecialOptionVisible}
          setIsDevActive={setIsDevActive}
          isDevActive={isDevActive}
        />
      )}
    </>
  );
}

export default Settings;
