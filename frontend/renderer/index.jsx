/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";

import App from "./src/App";

// Crée la racine de l'application React.
const root = ReactDOM.createRoot(document.getElementById("root"));

// Rend le composant <App /> dans le DOM.
// Le "StrictMode" est un outil pour détecter les problèmes potentiels dans l'application.
root.render(
  <React.StrictMode>
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={2000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <App />
    </SnackbarProvider>
  </React.StrictMode>
);
