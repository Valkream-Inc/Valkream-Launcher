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
  const [isConfirmAdminVisible, setIsConfirmAdminVisible] = useState(false);
  const [isAdminActive, setIsAdminActive] = useState(false);
  const [isDevActive, setIsDevActive] = useState(false);

  const toogleAdmin = () => {
    enqueueSnackbar(
      isAdminActive
        ? "Options Admin désactivées !"
        : "Options Admin activées !",
      { variant: "warning" },
    );
    setIsAdminActive(!isAdminActive);
  };

  const EnabledAdmin = () => {
    return (
      <SpecialPanel
        type="warning"
        paragraph="Vous êtes sur le point d’activer des options avancées pouvant endommager votre installation (Admin Tools, Debug Tools, Dev Tools, Fonctionnalités Alpha). Êtes-vous sûr de vouloir continuer ?"
        buttons={[
          {
            text: "Continuer",
            onClick: () => {
              toogleAdmin();
              setIsConfirmAdminVisible(false);
            },
          },
          {
            text: "Annuler et revenir",
            onClick: () => setIsConfirmAdminVisible(false),
          },
        ]}
      />
    );
  };
  if (isConfirmAdminVisible) return <EnabledAdmin />;

  const changeTab = (tab: string) => setActiveTab(tab);

  // Rien à libérer au retour à l'accueil : les onglets lisent le rapport de l'instance
  const returnToHome = () => {};

  function ToggleIsConfirmAdminVisible() {
    // si déja activés --> les désactivés
    if (isConfirmAdminVisible) {
      setIsAdminActive(false);
      setIsConfirmAdminVisible(false);
    }
    // sinon rendre visible le panel de confirmation
    else setIsConfirmAdminVisible(true);
  }

  return (
    <InstanceSettings
      instanceId={actualInstanceId}
      returnToHome={returnToHome}
      changeTab={changeTab}
      activeTab={activeTab}
      ToggleIsConfirmAdminVisible={ToggleIsConfirmAdminVisible}
      isAdminActive={isAdminActive}
      setIsDevActive={setIsDevActive}
      isDevActive={isDevActive}
    />
  );
}

export default Settings;
