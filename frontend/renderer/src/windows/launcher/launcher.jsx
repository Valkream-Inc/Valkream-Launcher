import React from "react";
import Box from "@mui/material/Box";

import { BackgroundProvider } from "./context/background.context.jsx";
import { InfosProvider } from "./context/infos.context.jsx";
import { PanelsProvider, usePanels } from "./context/panels.context.jsx";
import { ThemeProvider } from "./context/theme.context.jsx";
import { ActionProvider } from "./context/action.context.jsx";
import { GamesProvider } from "./context/games.context.jsx";

import Background from "./component/background/background.jsx";
import Copyright from "./component/copyright/copyright.jsx";
import Panel from "./component/panel/panel.jsx";
import SpecialPanel from "./component/special-panel/special-panel.jsx";
import WindowsBar from "./component/windows-bar/windows-bar.jsx";

import Home from "./panels/home/home.jsx";
import Settings from "./panels/settings/settings.jsx";
import ChooseGames from "./panels/choose-games/choose-games.jsx";

function BetaEnabledPanel() {
  const { changePanel } = usePanels();
  const goHome = () => changePanel("choose-games");

  const desactiverBeta = async () => {
    await window.electron_API.setSettings("betaEnabled", false);
    return window.location.reload();
  };

  return (
    <Box sx={{ position: "absolute", inset: 0 }}>
      <SpecialPanel
        type="info"
        paragraph="Vous avez les tests betas activés ..."
        buttons={[
          { text: "Continuer", onClick: goHome },
          { text: "Les desactiver", onClick: desactiverBeta },
        ]}
      />
    </Box>
  );
}

function Launcher() {
  return (
    <>
      {/* Windows Bar */}
      <WindowsBar />

      <ActionProvider>
        <GamesProvider>
          <InfosProvider>
            <PanelsProvider>
              <BackgroundProvider>
                {/* Background */}
                <Background />

                {/* Panels */}
                <ThemeProvider>
                  <Panel id="info-beta-test">
                    <BetaEnabledPanel />
                  </Panel>
                  <Panel id="choose-games">
                    <ChooseGames />
                  </Panel>
                  <Panel id="home">
                    <Home />
                  </Panel>
                  <Panel id="settings">
                    <Settings />
                  </Panel>
                </ThemeProvider>
              </BackgroundProvider>

              {/* Copyright */}
              <Copyright />
            </PanelsProvider>
          </InfosProvider>
        </GamesProvider>
      </ActionProvider>
    </>
  );
}

export default Launcher;
