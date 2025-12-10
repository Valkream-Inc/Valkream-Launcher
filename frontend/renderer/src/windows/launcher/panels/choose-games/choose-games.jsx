/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Card, CardActionArea, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import React from "react";

import { useGames } from "../../context/games.context.jsx";
import { usePanels } from "../../context/panels.context.jsx";
import { useTheme } from "../../context/theme.context.jsx";

// 🧩 Tu peux mélanger icônes MUI et images personnalisées ici :
const games = [
  {
    id: "Valheim",
    name: "Valheim Valkream",
    icon: "./images/Valheim-icon.png",
  },
  {
    id: "SevenDtoD",
    name: "7 Days to Valkream",
    icon: "./images/SevenDtoD-icon.png",
  },
];

const ModernGameCard = styled(Card)(() => ({
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

const FuturisticGameCard = styled(Card)(() => ({
  background: "linear-gradient(135deg, #0d0d0d 0%, #1a0033 100%)",
  color: "#00ffff",
  textAlign: "center",
  borderRadius: 16,
  border: "1px solid rgba(0, 255, 255, 0.3)",
  boxShadow: "0 0 15px rgba(0, 255, 255, 0.1)",
  fontFamily: "'Orbitron', sans-serif",
  letterSpacing: "1px",
  textShadow: "0 0 8px rgba(0, 255, 255, 0.4)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.07)",
    boxShadow: "0 0 25px rgba(0, 255, 255, 0.6)",
    borderColor: "rgba(255, 0, 255, 0.5)",
  },
  "& .title": {
    color: "#ff00ff",
    fontWeight: 600,
  },
}));

const OldGameCard = styled(Card)(() => ({
  background: "radial-gradient(circle at top, #3b2f1e 0%, #1e1710 100%)",
  color: "#f0e6d2",
  textAlign: "center",
  borderRadius: 8,
  border: "2px solid #8b5a2b",
  boxShadow: "0 0 10px rgba(139, 90, 43, 0.4)",
  fontFamily: "'Cinzel Decorative', serif",
  letterSpacing: "0.5px",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0 0 25px rgba(245, 222, 179, 0.5)",
    borderColor: "#d4af37",
  },
  "& .title": {
    color: "#d4af37",
    fontWeight: 700,
  },
}));

const GameCard = ({ children }) => {
  const { theme } = useTheme();
  switch (theme) {
    case "modern":
      return <ModernGameCard>{children}</ModernGameCard>;
    case "futuristic":
      return <FuturisticGameCard>{children}</FuturisticGameCard>;
    case "old":
      return <OldGameCard>{children}</OldGameCard>;
    default:
      return <ModernGameCard>{children}</ModernGameCard>;
  }
};

export default function ChooseGames() {
  const { changeActualGame } = useGames();
  const { changePanel } = usePanels();
  const { theme } = useTheme();

  const handleClick = (gameId) => {
    changeActualGame(gameId);
    changePanel("home");
  };

  const backgroundColor = () => {
    switch (theme) {
      case "modern":
        return "#000";
      case "futuristic":
        return "#0a0014";
      case "old":
        return "#2b1d0e";
      default:
        return "#000";
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: backgroundColor(),
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
