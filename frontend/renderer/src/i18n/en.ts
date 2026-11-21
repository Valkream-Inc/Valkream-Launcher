/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * English UI texts (same keys as fr.ts, checked by i18n.test.ts).
 */

import type { Messages } from "./fr";

const en: Messages = {
  common: {
    close: "Close",
    cancel: "Cancel",
    change: "Change",
    loading: "Loading…",
    continue: "Continue",
  },
  language: {
    label: "Language",
    text: "Launcher interface language.",
    changed: "Language changed!",
    fr: "Français",
    en: "English",
  },
  updater: {
    searching: "⏳ Checking for updates...",
  },
  nav: {
    title: "Settings",
    save: "Save",
  },
  panel: {
    error: {
      title: "Critical error",
      text: "A serious problem occurred. You must restart your launcher. If the problem persists, please contact the administration team!",
    },
    warning: {
      title: "Warning",
      text: "An important update is available. Would you like to download it?",
    },
    info: {
      title: "Information",
      text: "The server is currently online and operational. Please log in to play.",
    },
  },
  admin: {
    on: "Admin options enabled!",
    off: "Admin options disabled!",
    cancelBack: "Cancel and go back",
    confirm:
      "You are about to enable advanced options that may damage your installation (Admin Tools, Debug Tools, Dev Tools, Alpha features). Are you sure you want to continue?",
  },
  beta: {
    panel: "You have beta testing enabled ...",
    disable: "Disable it",
    on: "Beta testing enabled!",
    off: "Beta testing disabled!",
    text: "Enable beta testing (fetches beta game updates). To bypass the launcher update: Ctrl + Shift + click on the start-up video.",
    label: "Enable beta testing",
  },
  settings: {
    music: {
      on: "Music enabled!",
      off: "Music disabled!",
      text: "Is the music bothering you? Turn it off here.",
      label: "Enable the video music",
    },
    dev: {
      on: "Developer tools enabled!",
      off: "Developer tools disabled!",
      text: "Need developer tools? Enable them here.",
      label: "Enable developer tools",
    },
    debug: {
      text: "You can open the debug tools (⚠️: only for debugging purposes and with qualified people :) )",
      button: "Open debug",
    },
    appdata: {
      text: "You can open Valkream's AppData folder.",
      opened: "AppData opened!",
      notOpened: "AppData not opened!",
      button: "Open the AppData folder",
    },
    theme: {
      changed: "You changed the launcher theme!",
      text: "Want to change the launcher theme? Do it here.",
    },
    background: {
      changed: "You changed the launcher background!",
      text: "Want to change the launcher background? It's here!",
      video: "Video",
      image: "Image",
      threeD: "3D (powerful PC required)",
    },
    uninstallLauncher: {
      done: "Launcher uninstalled!",
      failed: "Launcher not uninstalled!",
      text: "Want to uninstall the launcher and the games? Do it here. Be careful: you will lose all game settings, but you will keep your characters.",
      button: "Uninstall",
    },
    gamesRoot: {
      text: "Games installation folder. Changing the folder moves the games already installed (can take several minutes on another drive).",
      change: "Change",
      moving: "Moving…",
      reset: "Default folder",
      moved: "Games moved to {{folder}}",
    },
  },
  instance: {
    noConfig: "Instance “{{id}}” has no render config.",
    dangerZone: "⚠️ Danger zone!",
    advanced: "⚠️ Advanced!",
    noMods: "No mod to display for this instance.",
    steam: {
      on: "Steam will be started before the game.",
      off: "Steam will no longer be started by the launcher.",
      text: "Start Steam before the game (required to verify that you own it)?",
      label: "Start Steam with the game",
    },
    saveFailed: "Setting not saved!",
    openGame: {
      text: "You can open Valkream's game folder.",
      opened: "Game folder opened!",
      notOpened: "Game folder not opened!",
      button: "Open the game folder",
    },
    uninstall: {
      done: "Game uninstalled!",
      failed: "Game not uninstalled!",
      text: "You can delete the Valkream game files.",
      button: "Uninstall the game",
    },
    behavior: {
      saved: "Launcher behavior saved!",
      text: "Launcher behavior when the game starts:",
      hide: "Hide the launcher",
      close: "Close the launcher",
      nothing: "Do nothing",
    },
  },
  home: {
    tips: "Tips of the day",
    event: "Event",
    moreDetails: "See more details",
    maintenance: "Maintenance",
    loading: "🟠 Loading ...",
    inMaintenance: "🔵 Under maintenance",
    online: "🟢 Online",
    offline: "🔴 Offline",
  },
  games: {
    search: "Search for a game...",
    searchLabel: "Search",
    none: "No game found for “{{search}}”",
  },
  button: {
    welcome: "Welcome to the Valkream launcher! 👋",
    cancelled: "Installation cancelled",
    install: "Install",
    reinstall: "Reinstall\n (⚠️ New major version.)",
    update: "Update",
    play: "Play",
    playVersion: "Play v{{version}}",
    maintenance: "\n (⚠️ Maintenance in progress.)",
    dangerActive: "\n (⚠️ {{label}} enabled.)",
    cannotInstall: "Installation impossible\n (❌ No connection {{what}}.)",
    playOffline: "{{play}}\n (⚠️ No connection {{what}}.)",
    incomplete: "Incomplete installation\n (❌ Connection required.)",
    toServer: "to the server",
    toInternet: "to the internet",
    unknown: "Unknown error, please contact support.",
    checkError: "Check error",
    checkErrorToast: "Error while checking the version!",
    launchError: "Error while launching the game!",
    installing: "installation",
    updating: "update",
    installDone: "Installation complete!",
    updateDone: "Update complete!",
    errorDuring: "Error during {{action}}!",
    speed: "{{percent}}% ({{done}}{{total}}) at {{speed}}/s",
  },
  steam: {
    dialogTitle: "The game cannot be used as is",
    pick: "Locate the installation",
    depot: "Download the right version (QR)",
    cancelDepot: "Cancel the download",
    retry: "I installed the right version: retry",
    scan: "Scan the QR code with the Steam mobile app (Steam Guard → “Scan a QR code”). The launcher never sees your password.",
    infoTitle: "Before you use DepotDownloader",
    infoContinue: "I understand, continue",
    info: {
      what: "**DepotDownloader** is an open source tool (GPL-2.0 license) that downloads a specific version of a game from Steam's servers.",
      source: "Source code: {{url}}",
      title: "What happens",
      step1: "1. The launcher downloads the official **{{version}}** version of the tool, checks its sha256 fingerprint, then stores it in `{{dir}}`. If it was modified, it is refused.",
      step2: "2. A window shows a **QR code**: scan it with the Steam mobile app. Your password and Steam Guard code never go through the launcher.",
      step3: "3. The game is downloaded into `{{dir}}`, then each file is verified before being copied into the instance. This folder is then deleted.",
      step4: "4. The game must belong to your Steam account. Never share the downloaded files.",
      cancel: "You can cancel at any time.",
      notConfigured: "not configured",
    },
  },
};

export default en;
