// src/index.js

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App"; // Importe le composant App que nous avons créé

// Crée la racine de l'application React.
const root = ReactDOM.createRoot(document.getElementById("root"));

// Rend le composant <App /> dans le DOM.
// Le "StrictMode" est un outil pour détecter les problèmes potentiels dans l'application.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
