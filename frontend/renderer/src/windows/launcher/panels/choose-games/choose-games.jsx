/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import { useGames } from "../../context/games.context.jsx";
import { usePanels } from "../../context/panels.context.jsx";
import { useTheme } from "../../context/theme.context.jsx";

// 🧩 Tu peux mélanger icônes MUI et images personnalisées ici :
// `name` sert à l'affichage (alt) et à la recherche.
const games = [
  {
    id: "Valheim",
    name: "Valheim",
    icon: "./images/Valheim-name.png",
  },
  {
    id: "SevenDtoD",
    name: "7 Days to Die",
    icon: "./images/SevenDtoD-name.png",
  },
];

// Normalise : minuscules, sans accents, sans espaces
const normalize = (str) =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");

// Distance de Levenshtein (tolérance aux fautes de frappe)
const levenshtein = (a, b) => {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
};

// Correspondance floue basée sur la distance d'édition.
// Retourne null (pas de match) ou { distance, position } :
// - distance : 0 = sous-chaîne exacte, 1+ = nombre de fautes de frappe
// - position : index du meilleur match dans le texte (plus petit = mieux)
const fuzzyMatch = (query, target) => {
  if (!query) return { distance: 0, position: 0 };
  if (!target) return null;

  // 1. Sous-chaîne exacte → distance 0
  const index = target.indexOf(query);
  if (index !== -1) return { distance: 0, position: index };

  // 2. Fautes de frappe : "valhiem" → "valheim"
  const maxDist =
    query.length >= 3 ? Math.max(1, Math.floor(query.length / 4)) : 0;
  if (maxDist > 0) {
    let best = Infinity;
    let position = 0;
    for (let len = query.length - 1; len <= query.length + 1; len++) {
      if (len < 1) continue;
      if (len >= target.length) {
        const d = levenshtein(query, target);
        if (d < best) {
          best = d;
          position = 0;
        }
        continue;
      }
      for (let i = 0; i + len <= target.length; i++) {
        const d = levenshtein(query, target.slice(i, i + len));
        if (d < best) {
          best = d;
          position = i;
        }
      }
    }
    if (best <= maxDist) return { distance: best, position };
  }

  // 3. Sous-séquence : "svn" → "seven" (classée après les fautes de frappe)
  let t = 0;
  let gaps = 0;
  let first = -1;
  for (const char of query) {
    const found = target.indexOf(char, t);
    if (found === -1) return null;
    if (first === -1) first = found;
    gaps += found - t;
    t = found + 1;
  }
  return { distance: maxDist + 1 + gaps / 100, position: first };
};

const ModernGameCard = styled(Card)(() => ({
  backgroundColor: "#0a0a0a",
  color: "#fff",
  textAlign: "center",
  borderRadius: 12,
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0 0 20px rgba(255, 255, 255, 0.96)",
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

// Couleurs de la barre de recherche selon le thème
const searchColors = (theme) => {
  switch (theme) {
    case "futuristic":
      return {
        text: "#00ffff",
        border: "rgba(0, 255, 255, 0.4)",
        focus: "#ff00ff",
        bg: "rgba(26, 0, 51, 0.6)",
      };
    case "old":
      return {
        text: "#f0e6d2",
        border: "#8b5a2b",
        focus: "#d4af37",
        bg: "rgba(30, 23, 16, 0.8)",
      };
    default:
      return {
        text: "#fff",
        border: "rgba(255, 255, 255, 0.3)",
        focus: "#fff",
        bg: "#0a0a0a",
      };
  }
};

export default function ChooseGames() {
  const { changeActualGame } = useGames();
  const { changePanel } = usePanels();
  const { theme } = useTheme();
  const [search, setSearch] = useState("");

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

  const filteredGames = useMemo(() => {
    const query = normalize(search);
    if (!query) return games;
    return games
      .map((game) => {
        const byName = fuzzyMatch(query, normalize(game.name));
        const byId = fuzzyMatch(query, normalize(game.id));
        // On garde le meilleur des deux (distance la plus faible, puis position)
        const match = [byName, byId]
          .filter(Boolean)
          .sort(
            (a, b) => a.distance - b.distance || a.position - b.position,
          )[0];
        return { game, match };
      })
      .filter(({ match }) => match)
      .sort(
        (a, b) =>
          // Tri par distance (pertinence), puis position, puis ordre alphabétique
          a.match.distance - b.match.distance ||
          a.match.position - b.match.position ||
          a.game.name.localeCompare(b.game.name),
      )
      .map(({ game }) => game);
  }, [search]);

  const colors = searchColors(theme);

  return (
    <>
      <Box
        sx={{
          backgroundColor: backgroundColor(),
          height: "100vh",
          minWidth: "100vw",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            style={{
              margin: "1cm",
              height: "20vh",
              minHeight: "3cm",
              maxHeight: "10cm",
              borderRadius: "8px",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
            src="./images/icon/Valkream-icon-with-name.png"
            alt="Valkream"
          />
        </Box>

        {/* 🔍 Barre de recherche */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
            mb: 3,
            px: 2,
          }}
        >
          <TextField
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un jeu..."
            autoFocus
            fullWidth
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <span role="img" aria-label="Rechercher">
                      🔍
                    </span>
                  </InputAdornment>
                ),
              },
              htmlInput: { "aria-label": "Rechercher un jeu" },
            }}
            sx={{
              maxWidth: 420,
              "& .MuiOutlinedInput-root": {
                color: colors.text,
                backgroundColor: colors.bg,
                borderRadius: 3,
                "& fieldset": { borderColor: colors.border },
                "&:hover fieldset": { borderColor: colors.focus },
                "&.Mui-focused fieldset": { borderColor: colors.focus },
              },
              "& input::placeholder": { color: colors.text, opacity: 0.6 },
            }}
          />
        </Box>

        {/* Zone scrollable : seuls les jeux défilent */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            px: 2,
            pt: 5,
            pb: 9,
          }}
        >
          <Grid
            container
            spacing={3}
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            {filteredGames.map((game) => (
              <Grid key={game.id}>
                <GameCard>
                  <CardActionArea onClick={() => handleClick(game.id)}>
                    <Box
                      sx={{
                        p: 3,
                        width: 220,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ width: "100%", height: 100 }}>
                        {typeof game.icon === "string" ? (
                          <img
                            src={game.icon}
                            alt={game.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          game.icon
                        )}
                      </Box>
                      <Typography
                        className="title"
                        sx={{
                          fontFamily: "inherit",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {game.name}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </GameCard>
              </Grid>
            ))}
          </Grid>

          {filteredGames.length === 0 && (
            <Typography
              sx={{
                textAlign: "center",
                mt: 4,
                color: colors.text,
                opacity: 0.7,
              }}
            >
              Aucun jeu trouvé pour « {search} »
            </Typography>
          )}
        </Box>
      </Box>
    </>
  );
}
