/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, { forwardRef, useImperativeHandle, useState } from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { keyframes } from "@mui/system";

import { useTheme } from "../../../context/theme.context.jsx";
import ModsSyncTable from "./components/ModsSyncTable"; // Importation du composant Tableau
import getModsThemeStyles from "./components/ModsStyle.jsx";

// Wait composant
const pulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: .5; }
  `;
const Wait = ({ children, isLoading }) => (
  <Box sx={isLoading ? { animation: `${pulse} 1.5s infinite` } : {}}>
    {children}
  </Box>
);

// --- DONNÉES DE MOCK MISES À JOUR AVEC hashLocal ET hashOnline ---
const MOCK_MODS_DATA = [
  // NEW: Pas de hash local (null), a un hash online
  {
    status: "NEW",
    oldPath: null,
    newPath: "/data/new_config_v3.json",
    hashLocal: null,
    hashOnline: "h003_online",
  },
  // MOVED: Hashes identiques, chemins différents
  {
    status: "MOVED",
    oldPath: "/old/assets/texture_pack_01.zip",
    newPath: "/new/assets/texture_pack_01.zip",
    hashLocal: "tex01_v1",
    hashOnline: "tex01_v1",
  },
  // MODIFIED: Hashes différents
  {
    status: "MODIFIED",
    oldPath: "/scripts/main_game_logic.lua",
    newPath: "/scripts/main_game_logic.lua",
    hashLocal: "logc_old",
    hashOnline: "logc_upd",
  },
  // UNCHANGED: Hashes identiques
  {
    status: "UNCHANGED",
    oldPath: "/shaders/lighting.hlsl",
    newPath: "/shaders/lighting.hlsl",
    hashLocal: "shdr1_ok",
    hashOnline: "shdr1_ok",
  },
  // NEW
  {
    status: "NEW",
    oldPath: null,
    newPath: "/maps/level_05_beta.dat",
    hashLocal: null,
    hashOnline: "map5_new",
  },
  // DELETED: A un hash local (existant localement), pas de hash online (supprimé/non trouvé en ligne)
  {
    status: "DELETED",
    oldPath: "/temp/debug_log.txt",
    newPath: null,
    hashLocal: "dbgl_del",
    hashOnline: null,
  },
  // MODIFIED
  {
    status: "MODIFIED",
    oldPath: "/interface/ui_skin_dark.dds",
    newPath: "/interface/ui_skin_dark.dds",
    hashLocal: "ui_old",
    hashOnline: "ui_upd",
  },
  // UNCHANGED
  {
    status: "UNCHANGED",
    oldPath: "/readme.txt",
    newPath: "/readme.txt",
    hashLocal: "read1_ok",
    hashOnline: "read1_ok",
  },
  // MOVED
  {
    status: "MOVED",
    oldPath: "/fkdkf/dfldl/fichier2",
    newPath: "/new/path/fichier2",
    hashLocal: "hash2_v1",
    hashOnline: "hash2_v1",
  },
  // MODIFIED
  {
    status: "MODIFIED",
    oldPath: "/document/important.pdf",
    newPath: "/document/important.pdf",
    hashLocal: "hash_old",
    hashOnline: "hash_new",
  },
  // DELETED
  {
    status: "DELETED",
    oldPath: "/archive/obsolete.zip",
    newPath: null,
    hashLocal: "hash_del",
    hashOnline: null,
  },
  // NEW
  {
    status: "NEW",
    oldPath: null,
    newPath: "/new/file3.txt",
    hashLocal: null,
    hashOnline: "hash3_new",
  },
  // UNCHANGED
  {
    status: "UNCHANGED",
    oldPath: "/tot/tatra/fichier.txt",
    newPath: "/tot/tatra/fichier.txt",
    hashLocal: "hash1_ok",
    hashOnline: "hash1_ok",
  },
  // MODIFIED
  {
    status: "MODIFIED",
    oldPath: "/config/game.xml",
    newPath: "/config/game.xml",
    hashLocal: "h001_v1",
    hashOnline: "h001_v2",
  },
  // NEW
  {
    status: "NEW",
    oldPath: null,
    newPath: "/assets/texture_v2.zip",
    hashLocal: null,
    hashOnline: "h002_new",
  },
  // UNCHANGED
  {
    status: "UNCHANGED",
    oldPath: "/sound/ambience.ogg",
    newPath: "/sound/ambience.ogg",
    hashLocal: "amb01_ok",
    hashOnline: "amb01_ok",
  },
  // DELETED
  {
    status: "DELETED",
    oldPath: "/old_patch_data/patch_01.dat",
    newPath: null,
    hashLocal: "p01_del",
    hashOnline: null,
  },
  // MOVED (mais a aussi été modifié localement? Non, le hash est le même pour MOVED en général)
  {
    status: "MOVED",
    oldPath: "/models/player_v1.mdl",
    newPath: "/models/player_v2.mdl",
    hashLocal: "plmv2_v1",
    hashOnline: "plmv2_v1",
  },
];

// --- COMPOSANT PRINCIPAL (Le reste est inchangé, il passe juste les données) ---

const SevenDtotD_ModsTab = forwardRef((props, ref) => {
  const { theme } = useTheme();
  const themeStyles = getModsThemeStyles(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [modsToDisplay, setModsToDisplay] = useState([]);

  const fetchMods = async () => {
    setIsLoading(true);
    try {
      setModsToDisplay(await window.electron_SevenDtoD_API.getModsData());
    } catch (err) {
      console.error(err);
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  useImperativeHandle(ref, () => ({
    reload: () => fetchMods(),
    freeze: () => {},
    stop: () => {},
  }));

  const DynamicSettingsTitle = ({ children }) => (
    <Typography
      variant="h5"
      component="h2"
      sx={{
        fontWeight: "bold",
        mb: 2,
        color: themeStyles.textPrimary,
        fontFamily: themeStyles.fontFamily,
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: themeStyles.mainBg,
        color: themeStyles.textPrimary,
        borderRadius: 2,
        boxShadow: themeStyles.boxShadow,
        maxWidth: "90%",
        mx: "auto",
        my: 4,
        fontFamily: themeStyles.fontFamily,
      }}
    >
      <DynamicSettingsTitle>
        Statut de Synchronisation des Mods
      </DynamicSettingsTitle>

      <Wait isLoading={isLoading}>
        <ModsSyncTable
          modsToDisplay={modsToDisplay}
          theme={theme}
          themeStyles={themeStyles}
        />
      </Wait>
    </Box>
  );
});

export default SevenDtotD_ModsTab;
