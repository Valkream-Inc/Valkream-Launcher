/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { SnackbarProvider } from "notistack";

import App from "./src/App";
import { initI18n, registerInstanceTranslations } from "./src/i18n";
import instancesRenderConfig from "./src/instances/instances.config";

// Crée la racine de l'application React.
const container = document.getElementById("root");
if (!container) throw new Error("Élément #root introuvable");
const root = ReactDOM.createRoot(container);

// Rend le composant <App /> dans le DOM.
// Le "StrictMode" est un outil pour détecter les problèmes potentiels dans l'application.
// La langue est chargée avant le premier rendu (aucun clignotement fr → en)
void initI18n().then(() => {
  registerInstanceTranslations(instancesRenderConfig);
  root.render(
  <React.StrictMode>
    <SnackbarProvider
      maxSnack={3}
      autoHideDuration={2000}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <App />
    </SnackbarProvider>
  </React.StrictMode>,
  );
});
