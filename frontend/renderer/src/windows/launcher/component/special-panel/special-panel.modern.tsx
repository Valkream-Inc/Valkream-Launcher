/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Button, Paper, Stack, Typography } from "@mui/material";
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
        bgcolor: "background.default",
        color: "text.primary",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 600,
          borderRadius: 3,
          bgcolor: "background.paper",
          borderLeft: 6,
          borderColor: `${data.color}.main`,
          color: "text.primary",
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            alignItems: "flex-start",
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: "2.5rem",
              lineHeight: 1,
              color: `${data.color}.main`,
            }}
          >
            {data.icon}
          </Typography>

          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ color: `${data.color}.main` }}
            >
              {data.title}
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              {data.paragraph}
            </Typography>

            {buttons.length > 0 && (
              <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
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

export default SpecialPanelModern;
