import React from "react";

import { BackgroundProvider } from "./context/background.context.jsx";
import { PanelsProvider } from "./context/panels.context.jsx";
import { ServerStatusProvider } from "./context/server-status.context.jsx";
import { ThemeProvider } from "./context/theme.context.jsx";

import Background from "./component/background/background.jsx";
import Copyright from "./component/copyright/copyright.jsx";
import Panel from "./component/panel/panel.jsx";
import WindowsBar from "./component/windows-bar/windows-bar.jsx";

import Home from "./panels/home/home.jsx";
import Settings from "./panels/settings/settings.jsx";

function Launcher() {
  return (
    <>
      {/* Windows Bar */}
      <WindowsBar />
      <ServerStatusProvider>
        <PanelsProvider>
          <BackgroundProvider>
            {/* Background */}
            <Background />

            {/* Panels */}
            <ThemeProvider>
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
      </ServerStatusProvider>
    </>
  );
}

export default Launcher;
