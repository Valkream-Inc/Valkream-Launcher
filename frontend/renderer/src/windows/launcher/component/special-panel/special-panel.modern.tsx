/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { memo } from "react";
import type {
  SpecialPanelThemeProps,
  SpecialPanelType,
} from "./special-panel.types";

const alertData: Record<
  SpecialPanelType,
  { icon: string; color: "error" | "warning" | "info" }
> = {
  error: {
    icon: "⛔",
    color: "error",
  },
  warning: {
    icon: "⚠️",
    color: "warning",
  },
  info: {
    icon: "💡",
    color: "info",
  },
};

function SpecialPanelModern({
  type = "info",
  buttons = [],
  title,
  paragraph,
}: SpecialPanelThemeProps) {
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
        bgcolor: "#121212",
        color: "white",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 600,
          borderRadius: 3,
          bgcolor: "#1e1e1e",
          borderLeft: (theme) => `6px solid ${theme.palette[data.color].main}`,
          color: "white",
        }}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Typography
            component="span"
            sx={{
              fontSize: "2.5rem",
              lineHeight: 1,
              color: (theme) => theme.palette[data.color].main,
            }}
          >
            {data.icon}
          </Typography>

          <Box flex={1}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: (theme) => theme.palette[data.color].main }}
            >
              {data.title}
            </Typography>
            <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)" }}>
              {data.paragraph}
            </Typography>

            {buttons.length > 0 && (
              <Stack direction="row" spacing={2} mt={3}>
                {buttons.map((btn, idx) => (
                  <Button
                    key={idx}
                    variant="outlined"
                    color={data.color}
                    onClick={btn.onClick}
                  >
                    {btn.text}
                  </Button>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default memo(SpecialPanelModern);
