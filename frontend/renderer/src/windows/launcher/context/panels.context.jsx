import React, { createContext, useState, useContext } from "react";

const PanelsContext = createContext();
export const usePanels = () => useContext(PanelsContext);

export const PanelsProvider = ({ children }) => {
  const [activePanel, setActivePanel] = useState("home");

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
