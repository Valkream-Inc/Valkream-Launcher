/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { enqueueSnackbar } from "notistack";
import React, { useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel"; // Nouveau composant pour l'icône de tri
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

// Icônes
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";

import ModsSyncRow from "./ModsSyncRow";

// Définition de l'ordre de priorité pour le tri par STATUT
const STATUS_ORDER = {
  NEW: 1,
  MODIFIED: 2,
  DELETED: 3,
  MOVED: 4,
  UNCHANGED: 5, // Les inchangés en dernier
};

/**
 * Composant de barre d'outils pour le tableau de synchronisation.
 * (Inchangé, le bouton de tri statutaire a été retiré pour laisser place au tri par colonne)
 */
const ModsSyncTableToolbar = ({
  searchTerm,
  onSearchChange,
  themeStyles,
  modsToDisplay,
}) => {
  // Fonction pour copier les hashes locaux des mods actuellement affichés
  const handleCopyLocalHashes = async () => {
    const localHashes = await window.electron_SevenDtoD_API.getHashData();

    navigator.clipboard.writeText(localHashes).then(() =>
      enqueueSnackbar("Hashes copiés dans le presse-papiers !", {
        variant: "info",
      })
    );
  };

  return (
    <Box
      sx={{
        p: 1.5,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${themeStyles.borderColor}`,
        bgcolor: themeStyles.headerBg,
      }}
    >
      {/* Champ de Recherche */}
      <TextField
        variant="outlined"
        size="small"
        placeholder="Rechercher par chemin ou hash..."
        value={searchTerm}
        onChange={onSearchChange}
        sx={{
          flexGrow: 1,
          maxWidth: "400px",
          "& .MuiOutlinedInput-root": {
            color: themeStyles.textPrimary,
            backgroundColor: themeStyles.tableBg, // Fond du champ
            fontFamily: themeStyles.fontFamily,
            "& fieldset": {
              borderColor: themeStyles.borderColor,
            },
            "&:hover fieldset": {
              borderColor: themeStyles.textPrimary,
            },
          },
          "& .MuiInputLabel-root": {
            color: themeStyles.textSecondary,
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: themeStyles.textSecondary }} />
            </InputAdornment>
          ),
        }}
      />

      {/* Bouton Copier Hashes Locaux */}
      <Tooltip title="Copier tous les hashes locaux visibles (non-N/A)">
        <Button
          variant="contained"
          onClick={handleCopyLocalHashes}
          startIcon={<ContentCopyIcon />}
          sx={{
            ml: 2,
            bgcolor: themeStyles.textPrimary, // Utiliser la couleur principale pour un bouton d'action
            color: themeStyles.mainBg,
            "&:hover": {
              bgcolor: themeStyles.textSecondary,
            },
          }}
        >
          Copier Hashes Locaux (
          {modsToDisplay.filter((mod) => mod.hashLocal).length})
        </Button>
      </Tooltip>
    </Box>
  );
};

// =========================================================================
// Logique de tri

/**
 * Fonctions d'accès aux valeurs pour le tri
 * Clé: La valeur utilisée par l'état `sortBy`
 * Accessor: La fonction qui extrait la valeur de tri du `mod`
 */
const columnAccessors = {
  status: (mod) => STATUS_ORDER[mod.status] || 99,
  oldPath: (mod) => mod.oldPath || "",
  newPath: (mod) => mod.newPath || "", // Chemin le plus pertinent
  hashLocal: (mod) => mod.hashLocal || "",
  hashOnline: (mod) => mod.hashOnline || "",
};

/**
 * Gère la comparaison entre deux éléments (a et b) selon la clé de tri et la direction.
 */
const comparator = (a, b, orderBy, order) => {
  const accessor = columnAccessors[orderBy];
  if (!accessor) return 0;

  const valueA = accessor(a);
  const valueB = accessor(b);

  let comparison = 0;

  // Traitement spécial pour le statut
  if (orderBy === "status") {
    comparison = valueA - valueB;
  }
  // Tri alphabétique pour les chemins/hashes
  else {
    // Pour s'assurer que les valeurs nulles/vides restent stables ou sont triées comme les chaînes vides
    const strA = String(valueA).toLowerCase();
    const strB = String(valueB).toLowerCase();

    if (strA < strB) {
      comparison = -1;
    } else if (strA > strB) {
      comparison = 1;
    }
  }

  // Applique la direction de tri
  return order === "desc" ? comparison * -1 : comparison;
};

// =========================================================================
/**
 * Composant pour la structure du tableau des mods.
 */
const ModsSyncTable = ({ modsToDisplay: initialMods, theme, themeStyles }) => {
  const [searchTerm, setSearchTerm] = useState("");
  // Tri par défaut : statut (changements d'abord), en ordre ascendant
  const [sortBy, setSortBy] = useState("status");
  const [sortDirection, setSortDirection] = useState("asc");

  // Fonction pour gérer le clic sur l'en-tête de colonne
  const handleRequestSort = (property) => {
    // Si la même colonne est cliquée, inverser la direction. Sinon, trier en 'asc'.
    const isAsc = sortBy === property && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortBy(property);
  };

  // Filtration et Tri des données
  const modsToDisplay = useMemo(() => {
    let mods = initialMods;

    // 1. Filtration
    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      mods = mods.filter(
        (mod) =>
          mod.oldPath?.toLowerCase().includes(lowerCaseSearch) ||
          mod.newPath?.toLowerCase().includes(lowerCaseSearch) ||
          mod.hashLocal?.toLowerCase().includes(lowerCaseSearch) ||
          mod.hashOnline?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    // 2. Tri
    // Utilisation d'une copie du tableau pour le tri, car .sort modifie le tableau original
    const sortedMods = [...mods].sort((a, b) =>
      comparator(a, b, sortBy, sortDirection)
    );

    return sortedMods;
  }, [initialMods, searchTerm, sortBy, sortDirection]); // Dépendances ajoutées

  // Si la liste initiale est vide
  if (initialMods.length === 0) {
    return (
      <Typography
        sx={{
          textAlign: "center",
          color: themeStyles.textSecondary,
          py: 5,
        }}
      >
        Aucune donnée de synchronisation disponible.
      </Typography>
    );
  }

  // Définition des colonnes pour la boucle d'affichage de l'en-tête
  const headCells = [
    { id: "status", label: "Statut", width: "50px", disableSorting: false },
    { id: "oldPath", label: "Chemin Local (Ancien)", disableSorting: false },
    { id: "newPath", label: "Chemin Distant (Nouveau)", disableSorting: false },
    {
      id: "hashLocal",
      label: "Hash Local",
      width: "120px",
      disableSorting: false,
    },
    {
      id: "hashOnline",
      label: "Hash Online",
      width: "120px",
      disableSorting: false,
    },
  ];

  // NOTE: La colonne OldPath trie par le chemin si NewPath est vide/null,
  // et Status utilise STATUS_ORDER pour la priorité.

  return (
    <TableContainer
      component={Paper}
      sx={{
        mt: 2,
        border: `1px solid ${themeStyles.borderColor}`,
        borderRadius: 1,
        bgcolor: themeStyles.tableBg,
        boxShadow: "none",
      }}
    >
      {/* BARRE D'OUTILS */}
      <ModsSyncTableToolbar
        searchTerm={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        themeStyles={themeStyles}
        modsToDisplay={modsToDisplay}
      />

      <Table size="small" aria-label="mods synchronization table">
        <TableHead sx={{ bgcolor: themeStyles.headerBg }}>
          <TableRow>
            {headCells.map((headCell) => (
              <TableCell
                key={headCell.id}
                sortDirection={sortBy === headCell.id ? sortDirection : false}
                sx={{
                  fontWeight: "medium",
                  color: themeStyles.textPrimary,
                  width: headCell.width,
                  borderBottom: `1px solid ${themeStyles.borderColor}`,
                  // Style pour rendre la zone cliquable
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => handleRequestSort(headCell.id)}
              >
                <TableSortLabel
                  active={sortBy === headCell.id}
                  direction={sortBy === headCell.id ? sortDirection : "asc"}
                  sx={{
                    "& .MuiTableSortLabel-icon": {
                      color: `${themeStyles.textPrimary} !important`,
                    },
                    "&:hover .MuiTableSortLabel-icon": {
                      opacity: 0.7,
                    },
                  }}
                >
                  {headCell.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {modsToDisplay.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography sx={{ color: themeStyles.textSecondary, py: 2 }}>
                  Aucun résultat trouvé pour "{searchTerm}".
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            modsToDisplay.map((mod, index) => (
              <ModsSyncRow
                key={index}
                mod={mod}
                theme={theme}
                themeStyles={themeStyles}
              />
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ModsSyncTable;
