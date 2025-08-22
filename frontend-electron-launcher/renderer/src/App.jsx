// src/App.js

import React, { useState } from "react";

function App() {
  // `useState` est un hook React qui nous permet de gérer l'état local du composant.
  // `message` est la variable d'état, et `setMessage` est la fonction pour la modifier.
  const [message, setMessage] = useState("Cliquez sur le bouton");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      <div className="bg-white p-10 rounded-xl shadow-2xl text-center max-w-lg">
        {/* Affiche la variable d'état `message` dans un en-tête. */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{message}</h1>

        {/* Un bouton qui, au clic, appelle `setMessage` pour mettre à jour l'état. */}
        <button
          onClick={() => setMessage("Bouton cliqué !")}
          className="px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
        >
          Changer le message
        </button>
      </div>
    </div>
  );
}

export default App;
