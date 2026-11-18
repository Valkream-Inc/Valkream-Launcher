/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import { useRef, useState } from "react";
import SpecialPanel from "../../component/special-panel/special-panel";

import { useGames } from "../../context/games.context";
import InstanceSettings from "./instance/InstanceSettings";
import SevenDtoDSettings from "./SevenDtoD/SevenDtoD-Settings";
import type { ModsTabHandle } from "./settings.types";
import ValheimSettings from "./Valheim/Valheim-Settings";

function Settings() {
  const { actualGame, actualInstanceId } = useGames();
  const [activeTab, setActiveTab] = useState("general");
  const [isConfirmSpecialOptionVisible, setIsConfirmSpecialOptionVisible] =
    useState(false);
  const [isSpecialOptionVisible, setIsSpecialOptionVisible] = useState(false);
  const [isDevActive, setIsDevActive] = useState(false);

  const modsTabRef = useRef<ModsTabHandle>(null);

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

  const changeTab = (tab: string) => {
    if (modsTabRef?.current?.stop) {
      modsTabRef.current.stop();
    }

    setActiveTab(tab);

    if (tab === "mods" && modsTabRef?.current?.reload) {
      modsTabRef.current.reload();
    }
  };

  function returnToHome() {
    if (modsTabRef?.current?.stop && modsTabRef?.current?.freeze) {
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
      {actualInstanceId && (
        <InstanceSettings
          instanceId={actualInstanceId}
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
      {!actualInstanceId && actualGame === "Valheim" && (
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
      {!actualInstanceId && actualGame === "SevenDtoD" && (
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
