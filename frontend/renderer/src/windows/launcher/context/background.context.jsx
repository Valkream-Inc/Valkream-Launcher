/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";

const BackgroundContext = createContext();
export const useBackground = () => useContext(BackgroundContext);

export const BackgroundProvider = ({ children }) => {
  const VideoBackgroundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [backgroundType, setBackgroundType] = useState("video");

  const changeBackgroundType = async (value) => {
    const allowedValues = ["video", "image", "3d"];
    if (!allowedValues.includes(value))
      throw new Error("Invalid background type value");

    await window.electron_API.setSettings("backgroundType", value);
    return setBackgroundType(value);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const backgroundType = await window.electron_API.getSettings(
        "backgroundType"
      );
      if (backgroundType) changeBackgroundType(backgroundType);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkRef = (callback = () => {}) => {
    if (VideoBackgroundRef.current) callback();
    else requestAnimationFrame(() => checkRef(callback));
  };

  const play = () =>
    checkRef(() => {
      VideoBackgroundRef.current.play();
      setIsPlaying(true);
    });

  const pause = () =>
    checkRef(() => {
      VideoBackgroundRef.current.pause();
      setIsPlaying(false);
    });

  const mute = () =>
    checkRef(() => {
      VideoBackgroundRef.current.muted = true;
      setIsMuted(true);
    });

  const unmute = () =>
    checkRef(() => {
      VideoBackgroundRef.current.muted = false;
      setIsMuted(false);
    });

  const contextValue = {
    VideoBackgroundRef,
    isPlaying,
    isMuted,
    play,
    pause,
    mute,
    unmute,
    changeBackgroundType,
    backgroundType,
  };

  return (
    <BackgroundContext.Provider value={contextValue}>
      {children}
    </BackgroundContext.Provider>
  );
};
