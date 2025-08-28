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
import Settings from "./panels/settings/settings.jsx";

function Launcher() {
  return (
    <>
      {/* Windows Bar */}
      <WindowsBar />
      <ServerStatusProvider>
        <PanelsProvider>
          <VideoBackgroundProvider>
            {/* Video Background */}
            <VideoBackground />

            {/* Panels */}
            <ThemeProvider>
              <Panel id="home">
                <Home />
              </Panel>
              <Panel id="settings">
                <Settings />
              </Panel>
              <Panel id="alert">Alert</Panel>
              <Panel id="panel1">Panel1</Panel>
              <Panel id="panel2">Panel2</Panel>
              <Panel id="panel3">Panel3</Panel>
            </ThemeProvider>
          </VideoBackgroundProvider>
          {/* Copyright */}
          <Copyright />
        </PanelsProvider>
      </ServerStatusProvider>
    </>
  );
}

export default Launcher;
