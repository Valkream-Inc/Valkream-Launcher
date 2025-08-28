import React from "react";

import { PanelsProvider } from "./context/panels.context.jsx";
import { VideoBackgroundProvider } from "./context/video-background.context.jsx";
import { ServerStatusProvider } from "./context/server-status.context.jsx";
import { ThemeProvider } from "./context/theme.context.jsx";

import WindowsBar from "./component/windows-bar/windows-bar.jsx";
import VideoBackground from "./component/video-background/video-background.jsx";
import Copyright from "./component/copyright/copyright.jsx";
import Panel from "./component/panel/panel.jsx";

import Home from "./panels/home/home.jsx";

// function PanelButton() {
//   const { changePanel } = usePanels();
//   return (
//     <button onClick={() => changePanel("panel2")}>Change to Panel 2</button>
//   );
// }

function Launcher() {
  return (
    <>
      <ThemeProvider>
        {/* Windows Bar */}
        <WindowsBar />
        <ServerStatusProvider>
          <VideoBackgroundProvider>
            {/* Video Background */}
            <VideoBackground />

            {/* Panels */}
            <PanelsProvider>
              <Panel id="home">
                <Home />
              </Panel>
              <Panel id="alert">Alert</Panel>
              <Panel id="panel1">Panel1</Panel>
              <Panel id="panel2">Panel2</Panel>
              <Panel id="panel3">Panel3</Panel>
            </PanelsProvider>
          </VideoBackgroundProvider>
          {/* Copyright */}
          <Copyright />
        </ServerStatusProvider>
      </ThemeProvider>
    </>
  );
}

export default Launcher;
