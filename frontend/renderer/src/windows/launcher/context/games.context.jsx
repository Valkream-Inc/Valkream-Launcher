import React, { createContext, useState, useContext } from "react";

const GamesContext = createContext();
export const useGames = () => useContext(GamesContext);

export const GamesProvider = ({ children }) => {
  const gamesList = ["Valheim", "SevenDtoD"];
  const [actualGame, setActualGame] = useState("Valheim");

  const changeActualGame = (newGame) => {
    if (!gamesList.includes(newGame)) throw new Error("Game not found");

    return setActualGame(newGame);
  };

  const contextValue = {
    actualGame,
    changeActualGame,
  };

  return (
    <GamesContext.Provider value={contextValue}>
      {children}
    </GamesContext.Provider>
  );
};
