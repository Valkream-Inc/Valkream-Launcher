/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React, { useEffect, useRef, useState } from "react";
import "./updater.css";

export default function Updater() {
  const preloadVideoRef = useRef(null);
  const loadingSectionRef = useRef(null);
  const [message, setMessage] = useState("⏳ Recherche de mise à jour...");

  useEffect(() => {
    const preloadVideo = preloadVideoRef.current;
    const loadingSection = loadingSectionRef.current;

    if (!preloadVideo || !loadingSection) return;

    const handleVideoEnd = () => {
      // Affiche le loader et masque la vidéo
      loadingSection.style.opacity = 1;
      preloadVideo.style.display = "none";

      if (!window?.electron_API)
        return console.warn("Electron API is not active");

      // Vérifie les mises à jour
      window.electron_API.removeUpdateListeners();
      window.electron_API.checkForUpdates();

      // Écoute les messages de mise à jour
      window.electron_API.onUpdateStatus((msg) => setMessage(msg));

      // Quand la fenêtre principale doit être lancée
      window.electron_API.onLaunchMainWindow(() => {
        window.electron_API.removeUpdateListeners();
        window.electron_API.openMainWindow();
        window.electron_API.closeUpdateWindow();
      });
    };

    // Événement équivalent à "DOMContentLoaded + ended"
    preloadVideo.addEventListener("ended", handleVideoEnd);

    return () => {
      preloadVideo.removeEventListener("ended", handleVideoEnd);
    };
  }, []);

  return (
    <div className="loading-page">
      {/* Vidéo de preload */}
      <video ref={preloadVideoRef} id="preload-video" autoPlay playsInline>
        <source src="./videos/pre-loading.mp4" type="video/mp4" />
      </video>

      {/* Section de chargement */}
      <div ref={loadingSectionRef} id="loading-section">
        <div className="loading-content">
          <img
            src="./images/Valheim-icon-with-name.png"
            className="loading-image"
            alt="Logo Valkream"
          />
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        </div>
        <div id="loading-message">
          {message.split("\n").map((line, i) => (
            <React.Fragment key={i}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
