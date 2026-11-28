/**
 * @author Valkream Team
 * @license MIT-NC
 */

import Box from "@mui/material/Box";
import { lazy, Suspense, useEffect, useState } from "react";

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

import { enqueueSnackbar } from "notistack";
import { useTranslation } from "react-i18next";
import { formatBytes } from "../../i18n/format-bytes";
import type { GamesRootInfo } from "@shared/types";
import type {
  LauncherBackgroundProps,
  MainLauncherProvidersProps,
} from "./launcher.types";
import ChooseGames from "./panels/choose-games/choose-games";
import Home from "./panels/home/home";


// Les réglages (mods, outils, debug) ne servent pas au démarrage : chargés à part
const Settings = lazy(() => import("./panels/settings/settings"));

/** Premier lancement : où installer les jeux (dossier proposé, espace libre, choix d'un autre dossier). */
function GamesRootChoicePanel() {
  const { t } = useTranslation();
  const { changePanel } = usePanels();
  const { refreshChannel } = useGames();
  const [info, setInfo] = useState<GamesRootInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => setInfo(await window.electron_API.getGamesRoot());
  useEffect(() => {
    void load();
  }, []);

  // Dossier validé : les jeux sont relus depuis le bon dossier, puis on suit le parcours habituel
  const done = async () => {
    await refreshChannel();
    const betaEnabled = await window.electron_API.getSettings("betaEnabled");
    changePanel(betaEnabled ? "info-beta-test" : "choose-games");
  };

  const keep = async () => {
    setBusy(true);
    try {
      await window.electron_API.confirmGamesRoot();
      await done();
    } finally {
      setBusy(false);
    }
  };

  const change = async () => {
    setBusy(true);
    try {
      const folder = await window.electron_API.changeGamesRoot();
      if (folder) {
        enqueueSnackbar(t("settings.gamesRoot.moved", { folder }), { variant: "success" });
        await done();
      }
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      enqueueSnackbar(raw.replace(/^Error invoking remote method '[^']+': (\w*Error: )?/, ""), { variant: "error" });
      await load(); // l'état réel (dossier, espace libre) peut avoir changé
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ position: "absolute", inset: 0 }}>
      <SpecialPanel
        type="info"
        paragraph={t("gamesRootChoice.text", {
          path: info?.path ?? "…",
          free: info?.freeBytes != null ? formatBytes(info.freeBytes) : t("gamesRootChoice.unknownFree"),
        })}
        buttons={
          info && !busy
            ? [
                { text: t("gamesRootChoice.keep"), onClick: keep },
                { text: t("gamesRootChoice.change"), onClick: change },
              ]
            : []
        }
      />
    </Box>
  );
}

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
  const { changePanel, activePanel } = usePanels();
  useEffect(() => {
    // Premier lancement : le choix du dossier passe avant tout (il mène lui-même au choix du jeu)
    if (!channelLost || activePanel === "choose-games-root") return;
    clearChannelLost();
    changePanel("choose-games");
  }, [channelLost, activePanel]);
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
          <Panel id="choose-games-root">
            <GamesRootChoicePanel />
          </Panel>
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
                <Suspense fallback={null}>
                  <Settings />
                </Suspense>
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
