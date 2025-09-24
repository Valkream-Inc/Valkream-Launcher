import { useState } from "react";

import ButtonsBar from "./component/buttons-bar/buttons-bar";
import Links from "./component/links/links";
import ServerInfo from "./component/server-info/server-info";

import Popup from "../../component/popup/popup";
import { usePanels } from "../../context/panels.context";
import UpdateMainButtonAction from "./updateMainButtonAction.jsx";

const TipsMessage = () => (
  <>
    Lorsque vous êtes en jeu, soyez connecté sur le serveur Mumble et dans le
    canal « Vocal en jeu » du serveur Discord Valkream.
    <br />
    <br />
    Les informations et actualités sont disponibles sur la page Web et sur le
    serveur Discord. (si vous avez besoin d'aide, n'hésitez pas à nous joindre
    sur notre serveur Discord)
  </>
);

function Home() {
  const { changePanel } = usePanels();

  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [isMainButtonDisabled, setIsMainButtonDisabled] = useState(false);
  const [mainButtonAction, setMainButtonAction] = useState({
    text: "Loading...",
    isReadyToPlay: false,
    onclick: () => {},
  });

  return (
    <>
      <Popup
        open={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        type="tips"
        title="Astuces du jour"
        message={<TipsMessage />}
      />
      <UpdateMainButtonAction
        changeMainButtonAction={setMainButtonAction}
        changeIsMainButtonDisabled={setIsMainButtonDisabled}
        isDisabled={isMainButtonDisabled}
      />
      <ServerInfo />
      <Links />
      <ButtonsBar
        onSettingsClick={() => changePanel("settings")}
        onTipsClick={() => setIsTipsOpen(true)}
        onPlayClick={() => mainButtonAction.onclick()}
        playIcon={mainButtonAction.isReadyToPlay}
        playButtonText={mainButtonAction.text}
        isDisabled={isMainButtonDisabled}
      />
    </>
  );
}

export default Home;
