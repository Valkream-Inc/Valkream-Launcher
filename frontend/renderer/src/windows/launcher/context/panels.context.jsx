import React, { createContext, useContext, useEffect, useState } from "react";

const PanelsContext = createContext();
export const usePanels = () => useContext(PanelsContext);

export const PanelsProvider = ({ children }) => {
  const [activePanel, setActivePanel] = useState("home");

  useEffect(() => {
    const loadSettings = async () => {
      const betaEnabled = await window.electron_API.getSettings("betaEnabled");
      if (betaEnabled) setActivePanel("info-beta-test");
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changePanel = (PanelsId) => {
    setActivePanel(PanelsId);
  };

  const contextValue = {
    activePanel,
    changePanel,
  };

  return (
    <PanelsContext.Provider value={contextValue}>
      {children}
    </PanelsContext.Provider>
  );
};
