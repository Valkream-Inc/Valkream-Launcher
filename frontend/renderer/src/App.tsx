/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import type { ErrorInfo } from "react";
import Copyright from "./windows/launcher/component/copyright/copyright";
import SpecialPanel from "./windows/launcher/component/special-panel/special-panel";
import WindowsBar from "./windows/launcher/component/windows-bar/windows-bar";
import { ThemeProvider } from "./windows/launcher/context/theme.context";
import Launcher from "./windows/launcher/launcher";
import Updater from "./windows/updater/updater";
import type { ErrorBoundaryProps, ErrorBoundaryState } from "./App.types";

const ErrorPage = () => (
  <ThemeProvider>
    <WindowsBar />
    <SpecialPanel type="error" />
    <Copyright />
  </ThemeProvider>
);

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
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
