import React from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

function HashChecks({ hashData }) {
  const {
    pluginLocalHash,
    pluginOnlineHash,
    configLocalHash,
    configOnlineHash,
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

  return (
    <Box sx={{ width: "80%", mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Vérification des fichiers (hash)
      </Typography>
      <TableContainer component={Paper}>
        <Table aria-label="hash check table">
          <TableHead>
            <TableRow>
              <TableCell>Dossier</TableCell>
              <TableCell>Hachage local</TableCell>
              <TableCell>Hachage distant</TableCell>
              <TableCell>État</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell component="th" scope="row">
                  {row.label}
                </TableCell>
                <TableCell>{row.local}</TableCell>
                <TableCell>{row.online}</TableCell>
                <TableCell>
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
      </TableContainer>
    </Box>
  );
}

export default HashChecks;
