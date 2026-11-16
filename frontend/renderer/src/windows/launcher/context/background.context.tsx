/**
 * @author Valkream Team
 * @license MIT-NC
 */

import {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
} from "react";
import type { BackgroundType } from "@shared/types";

import type {
  BackgroundContextValue,
  BackgroundProviderProps,
} from "./background.context.types";

const BackgroundContext = createContext<BackgroundContextValue | undefined>(
  undefined
);
export const useBackground = (): BackgroundContextValue => {
  const ctx = useContext(BackgroundContext);
  if (!ctx)
    throw new Error(
      "useBackground doit être utilisé dans un BackgroundProvider"
    );
  return ctx;
};

export const BackgroundProvider = ({ children }: BackgroundProviderProps) => {
  const VideoBackgroundRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [backgroundType, setBackgroundType] = useState<BackgroundType>("video");

  const changeBackgroundType = async (value: BackgroundType) => {
    const allowedValues: BackgroundType[] = ["video", "image", "3d"];
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
  }, []);

  const checkRef = (callback: () => void = () => {}): void => {
    if (VideoBackgroundRef.current) callback();
    else requestAnimationFrame(() => checkRef(callback));
  };

  const play = () =>
    checkRef(() => {
      VideoBackgroundRef.current?.play();
      setIsPlaying(true);
    });

  const pause = () =>
    checkRef(() => {
      VideoBackgroundRef.current?.pause();
      setIsPlaying(false);
    });

  const mute = () =>
    checkRef(() => {
      if (VideoBackgroundRef.current) VideoBackgroundRef.current.muted = true;
      setIsMuted(true);
    });

  const unmute = () =>
    checkRef(() => {
      if (VideoBackgroundRef.current) VideoBackgroundRef.current.muted = false;
      setIsMuted(false);
    });

  const contextValue: BackgroundContextValue = {
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
