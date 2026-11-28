/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { useEffect, useRef, useState } from "react";
import "./updater.css";
import { useTranslation } from "react-i18next";
import iconWithName from "../../assets/icon/Valkream-icon-with-name.png";
import preLoadingVideo from "../../assets/videos/pre-loading.mp4";

export default function Updater() {
  const { t } = useTranslation();
  const preloadVideoRef = useRef<HTMLVideoElement>(null);
  const loadingSectionRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState(t("updater.searching"));

  useEffect(() => {
    const preloadVideo = preloadVideoRef.current;
    const loadingSection = loadingSectionRef.current;
    const page = pageRef.current;

    if (!preloadVideo || !loadingSection || !page) return;

    // La vidéo n'est montrée qu'une fois sa première image prête, à sa taille finale (pas d'image minuscule
    // le temps du chargement des métadonnées).
    const showVideo = () => {
      preloadVideo.style.opacity = "1";
    };
    preloadVideo.addEventListener("loadeddata", showVideo);
    preloadVideo.addEventListener("playing", showVideo);
    if (preloadVideo.readyState >= 2) showVideo();
    const showTimer = setTimeout(showVideo, 1500); // filet de sécurité : jamais de vidéo invisible

    // Le contournement n'est possible que PENDANT la vidéo : dès qu'elle se termine, la recherche de mise à jour commence
    let videoDone = false;

    const handleVideoEnd = () => {
      videoDone = true;
      // Affiche le loader et masque la vidéo
      loadingSection.style.opacity = "1";
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

    // Contournement de la mise à jour : Ctrl + Maj + clic n'importe où dans la fenêtre, tant que la vidéo tourne.
    // L'écoute est sur la page : la vidéo ignore la souris (pointer-events: none), elle ne recevait donc jamais le clic.
    let bypassed = false;
    const handleBypass = (event: MouseEvent) => {
      if (!event.ctrlKey || !event.shiftKey || !window?.electron_API || bypassed || videoDone) return;
      bypassed = true;
      preloadVideo.removeEventListener("ended", handleVideoEnd);
      window.electron_API.removeUpdateListeners();
      window.electron_API.openMainWindow();
      window.electron_API.closeUpdateWindow();
    };
    page.addEventListener("click", handleBypass);

    // Événement équivalent à "DOMContentLoaded + ended"
    preloadVideo.addEventListener("ended", handleVideoEnd);

    return () => {
      preloadVideo.removeEventListener("ended", handleVideoEnd);
      clearTimeout(showTimer);
      page.removeEventListener("click", handleBypass);
      preloadVideo.removeEventListener("loadeddata", showVideo);
      preloadVideo.removeEventListener("playing", showVideo);
    };
  }, []);

  return (
    <div ref={pageRef} className="loading-page">
      {/* Vidéo de preload */}
      <video
        ref={preloadVideoRef}
        id="preload-video"
        autoPlay
        playsInline
        preload="auto"
        // Taille et visibilité en ligne : valables dès le premier rendu, même avant le chargement de la feuille de style
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", objectFit: "cover", opacity: 0 }}
      >
        <source src={preLoadingVideo} type="video/mp4" />
      </video>

      {/* Section de chargement */}
      <div ref={loadingSectionRef} id="loading-section">
        <div className="loading-content">
          <img
            src={iconWithName}
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
