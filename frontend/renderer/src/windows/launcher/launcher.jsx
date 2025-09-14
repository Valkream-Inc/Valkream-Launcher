import React from "react";

import { BackgroundProvider } from "./context/background.context.jsx";
import { InfosProvider } from "./context/infos.context.jsx";
import { PanelsProvider, usePanels } from "./context/panels.context.jsx";
import { ThemeProvider } from "./context/theme.context.jsx";

import Background from "./component/background/background.jsx";
import Copyright from "./component/copyright/copyright.jsx";
import Panel from "./component/panel/panel.jsx";
import SpecialPanel from "./component/special-panel/special-panel.jsx";
import WindowsBar from "./component/windows-bar/windows-bar.jsx";

import Home from "./panels/home/home.jsx";
import Settings from "./panels/settings/settings.jsx";

function BetaEnabledPanel() {
  const { changePanel } = usePanels();
  const goHome = () => changePanel("home");

  return (
    <SpecialPanel
      type="info"
      paragraph="Vous avez les tests betas activés ..."
      buttons={[
        {
          text: "Continuer",
          onClick: goHome,
        },
        { text: "Les desactiver", onClick: () => alert("Plus tard...") },
      ]}
    />
  );
}

function Launcher() {
  return (
    <>
      {/* Windows Bar */}
      <WindowsBar />
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
    </>
  );
}

export default Launcher;
