/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import { useState } from "react";
import SpecialPanel from "../../component/special-panel/special-panel";

import { useGames } from "../../context/games.context";
import InstanceSettings from "./instance/InstanceSettings";

function Settings() {
  const { actualInstanceId } = useGames();
  const [activeTab, setActiveTab] = useState("general");
  const [isConfirmSpecialOptionVisible, setIsConfirmSpecialOptionVisible] =
    useState(false);
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

  const changeTab = (tab: string) => setActiveTab(tab);

  // Rien à libérer au retour à l'accueil : les onglets lisent le rapport de l'instance
  const returnToHome = () => {};

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
    <InstanceSettings
      instanceId={actualInstanceId}
      returnToHome={returnToHome}
      changeTab={changeTab}
      activeTab={activeTab}
      ToggleIsConfirmSpecialOptionVisible={ToggleIsConfirmSpecialOptionVisible}
      isSpecialOptionVisible={isSpecialOptionVisible}
      setIsDevActive={setIsDevActive}
      isDevActive={isDevActive}
    />
  );
}

export default Settings;
