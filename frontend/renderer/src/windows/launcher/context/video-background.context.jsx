import React, { createContext, useState, useContext, useRef } from "react";

const VideoBackgroundContext = createContext();
export const useVideoBackground = () => useContext(VideoBackgroundContext);

export const VideoBackgroundProvider = ({ children }) => {
  const VideoBackgroundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
  };

  return (
    <VideoBackgroundContext.Provider value={contextValue}>
      {children}
    </VideoBackgroundContext.Provider>
  );
};
