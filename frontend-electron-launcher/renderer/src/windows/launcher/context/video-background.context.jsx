import React, { createContext, useState, useContext, useRef } from "react";

const VideoBackgroundContext = createContext();
export const useVideoBackground = () => useContext(VideoBackgroundContext);

export const VideoBackgroundProvider = ({ children }) => {
  const VideoBackgroundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const play = () => {
    if (VideoBackgroundRef.current) {
      VideoBackgroundRef.current.play();
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (VideoBackgroundRef.current) {
      VideoBackgroundRef.current.pause();
      setIsPlaying(false);
    }
  };

  const mute = () => {
    if (VideoBackgroundRef.current) {
      VideoBackgroundRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const unmute = () => {
    if (VideoBackgroundRef.current) {
      VideoBackgroundRef.current.muted = false;
      setIsMuted(false);
    }
  };

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
