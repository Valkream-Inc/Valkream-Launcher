/**
 * @author Valkream Team
 * @license MIT-NC
 */

import Box from "@mui/material/Box";
import { useEffect } from "react";

import { ActionProvider } from "./context/action.context";
import { BackgroundProvider } from "./context/background.context";
import { GamesProvider, useGames } from "./context/games.context";
import { InfosProvider } from "./context/infos.context";
import { PanelsProvider, usePanels } from "./context/panels.context";
import { ThemeProvider } from "./context/theme.context";

import Background from "./component/background/background";
import Copyright from "./component/copyright/copyright";
import Panel from "./component/panel/panel";
import SpecialPanel from "./component/special-panel/special-panel";
import WindowsBar from "./component/windows-bar/windows-bar";

import { useTranslation } from "react-i18next";
import type {
  LauncherBackgroundProps,
  MainLauncherProvidersProps,
} from "./launcher.types";
import ChooseGames from "./panels/choose-games/choose-games";
import Home from "./panels/home/home";
import Settings from "./panels/settings/settings";

function BetaEnabledPanel() {
  const { t } = useTranslation();
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
        paragraph={t("beta.panel")}
        buttons={[
          { text: t("common.continue"), onClick: goHome },
          { text: t("beta.disable"), onClick: desactiverBeta },
        ]}
      />
    </Box>
  );
}

/** Le canal actif n'est plus proposé (canaux de test désactivés, jeu sans stable) : retour au choix du jeu. */
function ChannelGuard() {
  const { channelLost, clearChannelLost } = useGames();
  const { changePanel } = usePanels();
  useEffect(() => {
    if (!channelLost) return;
    clearChannelLost();
    changePanel("choose-games");
  }, [channelLost]);
  return null;
}

function MainLauncherProviders({ children }: MainLauncherProvidersProps) {
  return (
    <ActionProvider>
      <GamesProvider>
        <PanelsProvider>
          <ChannelGuard />
          {children}
        </PanelsProvider>
      </GamesProvider>
    </ActionProvider>
  );
}

function LauncherBackground({ children }: LauncherBackgroundProps) {
  const { activePanel } = usePanels();
  return (
    <BackgroundProvider>
      {(activePanel === "home" || activePanel === "settings") && <Background />}
      {children}
    </BackgroundProvider>
  );
}

function Launcher() {
  return (
    <>
      {/* Windows Bar */}
      <WindowsBar />

      <MainLauncherProviders>
        {/* Panels */}
        <ThemeProvider>
          <Panel id="info-beta-test">
            <BetaEnabledPanel />
          </Panel>
          <Panel id="choose-games">
            <ChooseGames />
          </Panel>

          <InfosProvider>
            <LauncherBackground>
              <Panel id="home">
                <Home />
              </Panel>
              <Panel id="settings">
                <Settings />
              </Panel>
            </LauncherBackground>
          </InfosProvider>
        </ThemeProvider>

        {/* Copyright */}
        <Copyright />
      </MainLauncherProviders>
    </>
  );
}

export default Launcher;
