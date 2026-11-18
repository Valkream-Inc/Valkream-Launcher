/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { createContext, useState, useContext } from "react";
import type { GameName } from "@shared/types";

import type {
  GamesContextValue,
  GamesProviderProps,
} from "./games.context.types";

const GamesContext = createContext<GamesContextValue | undefined>(undefined);
export const useGames = (): GamesContextValue => {
  const ctx = useContext(GamesContext);
  if (!ctx) throw new Error("useGames doit être utilisé dans un GamesProvider");
  return ctx;
};

export const GamesProvider = ({ children }: GamesProviderProps) => {
  const gamesList: GameName[] = ["Valheim", "SevenDtoD"];
  const [actualGame, setActualGame] = useState<GameName>("Valheim");
  const [actualInstanceId, setActualInstanceId] = useState<string | null>(null);

  const changeActualGame = (newGame: GameName) => {
    if (!gamesList.includes(newGame)) throw new Error("Game not found");

    setActualInstanceId(null);
    return setActualGame(newGame);
  };

  const changeActualInstance = (instanceId: string) =>
    setActualInstanceId(instanceId);

  const contextValue: GamesContextValue = {
    actualGame,
    changeActualGame,
    actualInstanceId,
    changeActualInstance,
  };

  return (
    <GamesContext.Provider value={contextValue}>
      {children}
    </GamesContext.Provider>
  );
};
