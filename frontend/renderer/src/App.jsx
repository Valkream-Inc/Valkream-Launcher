/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Erreur capturée par ErrorBoundary :", error, info);
  }

  render() {
    if (this.state.hasError) return <ErrorPage />;
    else return this.props.children;
  }
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ErrorBoundary>
              <Launcher />
            </ErrorBoundary>
          }
        />
        <Route
          path="/updater"
          element={
            <ErrorBoundary>
              <Updater />
            </ErrorBoundary>
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
