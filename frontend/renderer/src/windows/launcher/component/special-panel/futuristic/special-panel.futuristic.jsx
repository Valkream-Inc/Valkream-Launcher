/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { Box, Button, Stack, Typography } from "@mui/material";
import React, { memo } from "react";
import "./special-panel.futuristic.css";

const alertData = {
  error: {
    icon: "⛔",
  },
  warning: {
    icon: "⚠️",
  },
  info: {
    icon: "💡",
  },
};

function SpecialPanelFuturistic({
  type = "info",
  buttons = [],
  title,
  paragraph,
}) {
  const data = {
    ...alertData[type],
    title,
    paragraph,
  };

  return (
    <Box className={`special-panel-futuristic ${type}`}>
      {/* Circuit décoratif */}
      <div className="circuit">
        <div className="line top"></div>
        <div className="line bottom"></div>
        <div className="line left"></div>
        <div className="line right"></div>
        <div className="line diag1"></div>
        <div className="line diag2"></div>
        <div className="line z1"></div>
        <div className="line z2"></div>
        <div className="line z3"></div>
        <div className="line v1"></div>
        <div className="line v2"></div>
        <div className="line diag"></div>
        <div className="line h1"></div>
        <div className="line h2"></div>
        <div className="line h3"></div>
        <div className="line v3"></div>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={`node n${i + 1}`} />
        ))}
      </div>

      {/* Fenêtre principale */}
      <Box className="special-panel-futuristic-box">
        <Typography className="icon">{data.icon}</Typography>
        <Box className="content">
          <Typography className="title">{data.title}</Typography>
          <Typography>{data.paragraph}</Typography>
          <Stack direction="row" spacing={2} mt={2}>
            {buttons.map((btn, idx) => (
              <Button
                key={idx}
                variant="outlined"
                color="inherit"
                onClick={btn.onClick}
                sx={{
                  borderColor: "var(--color)",
                  color: "var(--color)",
                  textShadow: "0 0 10px var(--color)",
                  "&:hover": {
                    background: "var(--color)",
                    color: "#000",
                    boxShadow: "0 0 15px var(--color)",
                  },
                }}
              >
                {btn.text}
              </Button>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default memo(SpecialPanelFuturistic);
