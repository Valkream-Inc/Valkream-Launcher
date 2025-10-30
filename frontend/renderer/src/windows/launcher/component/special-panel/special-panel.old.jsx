/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import React, { memo } from "react";

const alertData = {
  error: {
    icon: "☠️",
    color: "#8b0000", // rouge sombre
  },
  warning: {
    icon: "⚔️",
    color: "#c47f17", // bronze
  },
  info: {
    icon: "📜",
    color: "#3b6e22", // vert ancien
  },
};

function SpecialPanelOld({ type = "info", buttons = [], title, paragraph }) {
  const data = {
    ...alertData[type],
    title,
    paragraph,
  };

  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#2b1a0f", // fond brun sombre
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          maxWidth: 700,
          borderRadius: "12px",
          bgcolor: "#fdf5e6", // couleur parchemin
          border: `6px solid ${data.color}`,
          boxShadow: `0 0 25px ${data.color}`,
          fontFamily: "'MedievalSharp', 'Times New Roman', serif",
          color: "#2b1a0f",
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Icône */}
          <Typography
            component="span"
            sx={{ fontSize: "3rem", color: data.color }}
          >
            {data.icon}
          </Typography>

          {/* Titre calligraphique */}
          <Typography
            variant="h4"
            sx={{
              fontFamily: "'MedievalSharp', 'Times New Roman', serif",
              color: data.color,
              borderBottom: `2px solid ${data.color}`,
              pb: 1,
              textAlign: "center",
            }}
          >
            {data.title}
          </Typography>

          {/* Texte parchemin */}
          <Typography
            variant="body1"
            sx={{
              fontSize: "1.2rem",
              lineHeight: 1.8,
              textAlign: "center",
              color: "#3b2b1f",
            }}
          >
            {data.paragraph}
          </Typography>

          {/* Boutons façon sceaux */}
          {buttons.length > 0 && (
            <Stack direction="row" spacing={3} mt={2}>
              {buttons.map((btn, idx) => (
                <Button
                  key={idx}
                  onClick={btn.onClick}
                  sx={{
                    bgcolor: data.color,
                    color: "#fdf5e6",
                    fontFamily: "'MedievalSharp', serif",
                    fontWeight: "bold",
                    px: 3,
                    py: 1,
                    borderRadius: "50px", // arrondi comme un sceau
                    boxShadow: `0 0 15px ${data.color}`,
                    "&:hover": {
                      bgcolor: "#2b1a0f",
                      color: data.color,
                      border: `2px solid ${data.color}`,
                    },
                  }}
                >
                  {btn.text}
                </Button>
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}

export default memo(SpecialPanelOld);
