/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import {
  Avatar,
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React from "react";
import SettingsBox from "./settings-box/settings-box";

function CustomTableCell({ children }) {
  return <TableCell sx={{ color: "white" }}>{children}</TableCell>;
}

function ModCard({
  isDevActive = false,
  type = null,
  localVersion = "",
  onlineVersion = "",
  LastBuild = "",
  installed = false,
  name = "Chargement des mods...",
  description = "Veuillez patienter...",
  icon = "./images/icon/icon.png",
}) {
  let backgroundColor, color;
  const isOutdated =
    !localVersion || !onlineVersion || localVersion !== onlineVersion;
  const hasUpdateAvailable =
    !LastBuild || !onlineVersion || LastBuild !== onlineVersion;

  if (!isDevActive) {
    // affichage utilisateur
    if (isOutdated) {
      backgroundColor = "#f44336";
      color = "white";
    } else {
      backgroundColor = "#038913";
      color = "white";
    }
  } else {
    // affichage dev
    if (!installed) {
      backgroundColor = "#455a64"; // pas installé
      color = "white";
    } else if (!onlineVersion) {
      backgroundColor = "#6d4c41"; // hors modpack
      color = "white";
    } else {
      if (type === "special") {
        backgroundColor = hasUpdateAvailable ? "#0288d1" : "#303f9f";
        color = "white";
      } else if (type === "admin") {
        backgroundColor = hasUpdateAvailable ? "#ce93d8" : "#9c27b0";
        color = hasUpdateAvailable ? "black" : "white";
      } else {
        if (isOutdated && hasUpdateAvailable) {
          backgroundColor = "#ff7300"; // update + différent
          color = "white";
        } else if (isOutdated) {
          backgroundColor = "#f44336"; // différent du modpack
          color = "white";
        } else if (hasUpdateAvailable) {
          backgroundColor = "#ffb300"; // update dispo
          color = "black";
        } else {
          backgroundColor = "#038913"; // ok
          color = "white";
        }
      }
    }
  }

  return (
    <SettingsBox warn={false} sx={{ backgroundColor, color }}>
      <Container>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Avatar src={icon} sx={{ width: 64, height: 64 }} variant="rounded" />
          <Box>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                mb: 0,
                overflowWrap: "break-word",
                wordBreak: "break-word",
                wordWrap: "break-word",
              }}
            >
              {name}
              {!isDevActive && ` - ${localVersion}`}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {description}
            </Typography>
          </Box>
        </Box>
        {isDevActive && (
          <Table sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color }}>Version locale</TableCell>
                <TableCell sx={{ color }}>Version en ligne</TableCell>
                <TableCell sx={{ color }}>Dernier build</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell sx={{ color }}>{localVersion || "-"}</TableCell>
                <TableCell sx={{ color }}>{onlineVersion || "-"}</TableCell>
                <TableCell sx={{ color }}>{LastBuild || "-"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </Container>
    </SettingsBox>
  );
}

export default ModCard;
