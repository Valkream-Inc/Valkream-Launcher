import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableRow,
  LinearProgress,
  Alert,
} from "@mui/material";
import { Container, styled } from "@mui/system";

import SettingsBox from "./settings-box/settings-box.jsx";

const ColorBox = styled(Box)(({ theme, color }) => ({
  width: 16,
  height: 16,
  minWidth: 16,
  minHeight: 16,
  borderRadius: 4,
  backgroundColor: color,
}));

const legendItems = [
  { color: "#303f9f", label: "Mods spéciaux installés" },
  { color: "#0288d1", label: "Mods spéciaux à mettre à jour dans le modpack" },
  { color: "#9c27b0", label: "Mods admin installés" },
  { color: "#ce93d8", label: "Mods admin à mettre à jour dans le modpack" },
  { color: "#038913", label: "Mods normaux installés" },
  { color: "#ffb300", label: "Mods normaux à mettre à jour dans le modpack" },
  { color: "#f44336", label: "Version locale inégale à la version du modpack" },
  { color: "#ff7300", label: "Version locale inégale et MAJ disponible" },
  { color: "#455a64", label: "Mods non installés" },
  { color: "#6d4c41", label: "Mods non présents dans le modpack" },
];

function CustomTableCell({ children }) {
  return <TableCell sx={{ color: "white" }}>{children}</TableCell>;
}

function Legend({ stats, error }) {
  const percent = stats.total
    ? Math.round((stats.processed / stats.total) * 100)
    : 0;
  return (
    <SettingsBox warn={false}>
      <Container sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Légende
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {legendItems.map((item, index) => (
            <Box
              key={index}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <ColorBox color={item.color} />
              <Typography variant="body2">{item.label}</Typography>
            </Box>
          ))}
        </Box>

        <br />
        {error && (
          <Alert severity="error" variant="filled">
            {error}
          </Alert>
        )}

        <Box sx={{ width: "100%", mt: 2 }}>
          <LinearProgress
            variant="determinate"
            value={(stats.processed / stats.total) * 100 || 0}
          />
        </Box>

        <Table size="small">
          <TableBody sx={{ color: "var(--color)" }}>
            <TableRow>
              <CustomTableCell>Mods traités</CustomTableCell>
              <CustomTableCell>
                {stats.processed} / {stats.total} ({percent}%)
              </CustomTableCell>
            </TableRow>
            <TableRow>
              <CustomTableCell>Mises à jour disponibles</CustomTableCell>
              <CustomTableCell>{stats.updatesAvailable}</CustomTableCell>
            </TableRow>
            <TableRow>
              <CustomTableCell>Erreurs</CustomTableCell>
              <CustomTableCell>{stats.errors}</CustomTableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Container>
    </SettingsBox>
  );
}

export default Legend;
