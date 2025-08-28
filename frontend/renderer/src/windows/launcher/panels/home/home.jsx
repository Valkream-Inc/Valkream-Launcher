import { useState } from "react";

import ButtonsBar from "./component/buttons-bar/buttons-bar";
import ServerInfo from "./component/server-info/server-info";
import Links from "./component/links/links";

import { usePanels } from "../../context/panels.context";
import Popup from "../../component/popup/popup";
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
    <br />
    <br />
    <span style={{ color: "orange" }}>
      <b>
        ⚠️ La désinstallation du launcher doit UNIQUEMENT s’effectuer via le
        bouton prévu à cet effet, tout en bas dans les paramètres.
      </b>
    </span>
  </>
);

function Home() {
  const { changePanel } = usePanels();

  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [mainButtonAction, setMainButtonAction] = useState({
    text: "Loading...",
    onclick: () => {},
    isReadyToPlay: false,
    isDisabled: false,
  });

  const changeMainButtonAction = ({
    text,
    onclick,
    isReadyToPlay,
    isDisabled,
  }) => {
    setMainButtonAction((prevState) => ({
      text: text ?? prevState.text,
      onclick: onclick ?? prevState.onclick,
      isReadyToPlay: isReadyToPlay ?? prevState.isReadyToPlay,
      isDisabled: isDisabled ?? prevState.isDisabled,
    }));
  };

  return (
    <>
      <Popup
        open={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        type="tips"
        title="Astuces du jour"
        message={<TipsMessage />}
      />
      <UpdateMainButtonAction changeMainButtonAction={changeMainButtonAction} />
      <ServerInfo />
      <Links />
      <ButtonsBar
        onSettingsClick={() => changePanel("settings")}
        onTipsClick={() => setIsTipsOpen(true)}
        onPlayClick={() => mainButtonAction.onclick()}
        playIcon={mainButtonAction.isReadyToPlay}
        playButtonText={mainButtonAction.text}
        isDisabled={mainButtonAction.isDisabled}
      />
    </>
  );
}

export default Home;
