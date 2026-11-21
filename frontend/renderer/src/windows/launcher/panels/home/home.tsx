/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useState } from "react";
import { Box } from "@mui/material";

import ButtonsBar from "./component/buttons-bar/buttons-bar";
import Links from "./component/links/links";
import ServerInfo from "./component/server-info/server-info";
import Popup from "../../component/popup/popup";

import { useGames } from "../../context/games.context";
import { usePanels } from "../../context/panels.context";
import { useTranslation } from "react-i18next";

function Home() {
  const { t } = useTranslation();
  const { changePanel } = usePanels();
  const { actualInstance } = useGames();
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  return (
    <Box sx={{ position: "absolute", inset: 0, maxWidth: 0 }}>
      <Popup
        open={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        type="tips"
        title={t("home.tips")}
        message={actualInstance.tipContent}
      />

      <ServerInfo />

      <Links />

      <ButtonsBar
        onSettingsClick={() => changePanel("settings")}
        onChangeGamesClick={() => changePanel("choose-games")}
        onTipsClick={() => setIsTipsOpen(true)}
      />
    </Box>
  );
}

export default Home;
