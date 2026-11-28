/**
 * @author Valkream Team
 * @license MIT-NC
 *
 * Rendu Markdown minimal (titres, listes, gras, italique, code) pour les modes d'emploi du launcher.
 * Pas de HTML brut : tout est du texte React, rien n'est interprété comme balise.
 */

import React from "react";

import { Box, Typography } from "@mui/material";

const inline = (text: string): React.ReactNode[] =>
  text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/g)
    .filter((part) => part !== "")
    .map((part, index) => {
      if (part.startsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`")) return <code key={index}>{part.slice(1, -1)}</code>;
      if (part.length > 2 && part.startsWith("_") && part.endsWith("_")) return <em key={index}>{part.slice(1, -1)}</em>;
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });

export default function SimpleMarkdown({ source }: { source: string }) {
  return (
    <Box>
      {source.split("\n").map((line, index) => {
        if (line.trim() === "") return null;
        const heading = /^(#{2,3})\s+(.*)$/.exec(line);
        if (heading) {
          return (
            <Typography key={index} variant={heading[1].length === 2 ? "h6" : "subtitle1"} sx={{ mt: 1.5, fontWeight: 700 }}>
              {inline(heading[2])}
            </Typography>
          );
        }
        const item = /^(\d+\.)\s+(.*)$/.exec(line);
        if (item) {
          return (
            <Typography key={index} variant="body2" sx={{ pl: 2 }}>
              {item[1]} {inline(item[2])}
            </Typography>
          );
        }
        return (
          <Typography key={index} variant="body2" sx={{ mt: 0.5 }}>
            {inline(line)}
          </Typography>
        );
      })}
    </Box>
  );
}
