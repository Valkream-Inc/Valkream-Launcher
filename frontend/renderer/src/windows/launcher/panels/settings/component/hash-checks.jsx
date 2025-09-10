import React from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Container,
} from "@mui/material";
import SettingsBox from "./settings-box/settings-box";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

function HashChecks({ hashData }) {
  const {
    onlineConfigHash: configOnlineHash,
    onlinePluginsHash: pluginOnlineHash,
    localConfigHash: configLocalHash,
    localPluginsHash: pluginLocalHash,
  } = hashData;

  const rows = [
    {
      label: "Plugins",
      local: pluginLocalHash,
      online: pluginOnlineHash,
      isSame: pluginLocalHash === pluginOnlineHash,
    },
    {
      label: "Config",
      local: configLocalHash,
      online: configOnlineHash,
      isSame: configLocalHash === configOnlineHash,
    },
  ];

  const color = "white";

  return (
    <SettingsBox warn={false}>
      <Container sx={{ overflowY: "auto" }}>
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ color }}>Dossier</TableCell>
              <TableCell sx={{ color }}>Hachage local</TableCell>
              <TableCell sx={{ color }}>Hachage distant</TableCell>
              <TableCell sx={{ color }}>État</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell component="th" scope="row" sx={{ color }}>
                  {row.label}
                </TableCell>
                <TableCell sx={{ color }}>{row.local}</TableCell>
                <TableCell sx={{ color }}>{row.online}</TableCell>
                <TableCell sx={{ color }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {row.isSame ? (
                      <>
                        <CheckCircleIcon color="success" />
                        <Typography
                          variant="body2"
                          sx={{ color: "success.main" }}
                        >
                          OK
                        </Typography>
                      </>
                    ) : (
                      <>
                        <CancelIcon color="error" />
                        <Typography
                          variant="body2"
                          sx={{ color: "error.main" }}
                        >
                          Différent
                        </Typography>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Container>
    </SettingsBox>
  );
}

export default HashChecks;
