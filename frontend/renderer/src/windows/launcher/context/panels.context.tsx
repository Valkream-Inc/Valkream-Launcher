/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { createContext, useContext, useEffect, useState } from "react";

import type { PanelId } from "../../../types/panels.types";
import type {
  PanelsContextValue,
  PanelsProviderProps,
} from "./panels.context.types";

export const PanelsContext = createContext<PanelsContextValue | undefined>(undefined);
export const usePanels = (): PanelsContextValue => {
  const ctx = useContext(PanelsContext);
  if (!ctx)
    throw new Error("usePanels doit être utilisé dans un PanelsProvider");
  return ctx;
};

export const PanelsProvider = ({ children }: PanelsProviderProps) => {
  const [activePanel, setActivePanel] = useState<PanelId>("choose-games");

  useEffect(() => {
    const loadSettings = async () => {
      const betaEnabled = await window.electron_API.getSettings("betaEnabled");
      if (betaEnabled) setActivePanel("info-beta-test");
    };

    loadSettings();
  }, []);

  const changePanel = (PanelsId: PanelId) => {
    setActivePanel(PanelsId);
  };

  const contextValue: PanelsContextValue = {
    activePanel,
    changePanel,
  };

  return (
    <PanelsContext.Provider value={contextValue}>
      {children}
    </PanelsContext.Provider>
  );
};
