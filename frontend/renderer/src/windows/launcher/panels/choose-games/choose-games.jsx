import React from "react";
import { Box, Grid, Typography, Card, CardActionArea } from "@mui/material";
import { styled } from "@mui/material/styles";

import { useGames } from "../../context/games.context.jsx";
import { usePanels } from "../../context/panels.context.jsx";

// 🧩 Tu peux mélanger icônes MUI et images personnalisées ici :
const games = [
  {
    id: "Valheim",
    name: "Valheim Valkream",
    icon: "./images/Valheim-icon.png",
  },
  {
    id: "SevenDtoD",
    name: "7Days to Valkream",
    icon: "./images/SevenDtoD-icon.png",
  },
];

const GameCard = styled(Card)(() => ({
  backgroundColor: "#0a0a0a",
  color: "#fff",
  textAlign: "center",
  borderRadius: 12,
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0 0 20px rgba(255,255,255,0.2)",
  },
}));

export default function ChooseGames() {
  const { changeActualGame } = useGames();
  const { changePanel } = usePanels();

  const handleClick = (gameId) => {
    changeActualGame(gameId);
    changePanel("home");
  };

  return (
    <Box
      sx={{
        backgroundColor: "#000",
        minHeight: "100vh",
        minWidth: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Grid
        container
        spacing={3}
        justifyContent="center"
        alignItems="center"
        maxWidth="800px"
      >
        {games.map((game) => (
          <Grid key={game.id}>
            <GameCard>
              <CardActionArea onClick={() => handleClick(game.id)}>
                <Box
                  sx={{
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 180,
                  }}
                >
                  <Box
                    sx={{
                      mb: 1,
                      width: 64,
                      height: 64,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {typeof game.icon === "string" ? (
                      <img
                        src={game.icon}
                        alt={game.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          revert: "revert",
                        }}
                      />
                    ) : (
                      game.icon
                    )}
                  </Box>
                  <Typography variant="h6">{game.name}</Typography>
                </Box>
              </CardActionArea>
            </GameCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
