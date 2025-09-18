import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Copyright from "./windows/launcher/component/copyright/copyright.jsx";
import SpecialPanel from "./windows/launcher/component/special-panel/special-panel.jsx";
import WindowsBar from "./windows/launcher/component/windows-bar/windows-bar.jsx";
import { ThemeProvider } from "./windows/launcher/context/theme.context.jsx";
import Launcher from "./windows/launcher/launcher.jsx";
import Updater from "./windows/updater/updater.jsx";

const ErrorPage = () => (
  <ThemeProvider>
    <WindowsBar />
    <SpecialPanel type="error" />
    <Copyright />
  </ThemeProvider>
);

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Launcher />} errorElement={<ErrorPage />} />
        <Route
          path="/updater"
          element={<Updater />}
          errorElement={<ErrorPage />}
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
