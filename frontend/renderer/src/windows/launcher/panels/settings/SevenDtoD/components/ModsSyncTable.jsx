/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React, {
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react";

import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import Wait from "../../../../component/wait/wait";

import ModsSyncPagination from "./ModsSyncPagination";
import ModsSyncRow from "./ModsSyncRow";
import ModsSyncToolbar from "./ModsSyncToolBar";

const STATUS_ORDER = {
  NEW: 1,
  MODIFIED: 2,
  DELETED: 3,
  MOVED: 4,
  UNCHANGED: 5,
};

const columnAccessors = {
  status: (mod) => STATUS_ORDER[mod.status] || 99,
  oldPath: (mod) => mod.oldPath || "",
  newPath: (mod) => mod.newPath || "",
  hashLocal: (mod) => mod.hashLocal || "",
  hashOnline: (mod) => mod.hashOnline || "",
};

const comparator = (a, b, orderBy, order) => {
  const accessor = columnAccessors[orderBy];
  if (!accessor) return 0;

  const valueA = accessor(a);
  const valueB = accessor(b);

  let comparison = 0;

  if (orderBy === "status") {
    comparison = valueA - valueB;
  } else {
    comparison = String(valueA).localeCompare(String(valueB), undefined, {
      sensitivity: "base",
    });
  }

  return order === "desc" ? comparison * -1 : comparison;
};

const ModsSyncTable = ({
  modsToDisplay: initialMods = [],
  theme,
  themeStyles,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("status");
  const [sortDirection, setSortDirection] = useState("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [isPending, startTransition] = useTransition();

  // Reset de la page quand on cherche ou qu'on trie
  const handleSearchChange = (val) => {
    startTransition(() => {
      setSearchTerm(val);
      setPage(0);
    });
  };

  const handleRequestSort = (property) => {
    const isAsc = sortBy === property && sortDirection === "asc";
    const newOrder = isAsc ? "desc" : "asc";

    startTransition(() => {
      setSortDirection(newOrder);
      setSortBy(property);
      setPage(0);
    });
  };

  const deferredMods = useDeferredValue(initialMods);
  const isCalculating = deferredMods !== initialMods;

  const processedMods = useMemo(() => {
    const safeMods = Array.isArray(deferredMods) ? deferredMods : [];
    let result = [...safeMods];

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((mod) =>
        // Ajout de sécurités sur les champs du mod également
        (
          (mod.oldPath || "") +
          (mod.newPath || "") +
          (mod.hashLocal || "") +
          (mod.hashOnline || "")
        )
          .toLowerCase()
          .includes(lower)
      );
    }

    return result.sort((a, b) => comparator(a, b, sortBy, sortDirection));
  }, [deferredMods, searchTerm, sortBy, sortDirection]);

  const headCells = useMemo(
    () => [
      { id: "status", label: "Statut", width: "100px" },
      { id: "oldPath", label: "Chemin Local" },
      { id: "newPath", label: "Chemin Distant" },
      { id: "hashLocal", label: "Hash Local", width: "120px" },
      { id: "hashOnline", label: "Hash Online", width: "120px" },
    ],
    []
  );

  if (!initialMods || initialMods.length === 0) {
    return (
      <Typography
        sx={{ textAlign: "center", color: themeStyles.textSecondary, py: 5 }}
      >
        Aucune donnée disponible.
      </Typography>
    );
  }

  return (
    <>
      <Wait isVisible={isPending || isCalculating} />
      <TableContainer
        component={Paper}
        sx={{
          mt: 2,
          border: `1px solid ${themeStyles.borderColor}`,
          bgcolor: themeStyles.tableBg,
          backgroundImage: "none",
        }}
      >
        <ModsSyncToolbar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          themeStyles={themeStyles}
          modsToDisplay={processedMods}
        />

        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  sortDirection={sortBy === headCell.id ? sortDirection : false}
                  sx={{
                    bgcolor: themeStyles.headerBg,
                    color: themeStyles.textPrimary,
                    width: headCell.width,
                    fontWeight: "bold",
                  }}
                >
                  <TableSortLabel
                    active={sortBy === headCell.id}
                    direction={sortBy === headCell.id ? sortDirection : "asc"}
                    onClick={() => handleRequestSort(headCell.id)}
                    sx={{
                      "&.Mui-active": { color: themeStyles.textPrimary },
                      "& .MuiTableSortLabel-icon": {
                        color: `${themeStyles.textPrimary} !important`,
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
            {processedMods.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography sx={{ color: themeStyles.textSecondary, py: 4 }}>
                    Aucun résultat pour "{searchTerm}".
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              processedMods
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((mod, index) => (
                  <ModsSyncRow
                    key={`${mod.oldPath || mod.newPath}-${index}`}
                    mod={mod}
                    theme={theme}
                    themeStyles={themeStyles}
                  />
                ))
            )}
          </TableBody>
        </Table>

        <ModsSyncPagination
          processedMods={processedMods}
          themeStyles={themeStyles}
          page={page}
          setPage={setPage}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
        />
      </TableContainer>
    </>
  );
};

export default ModsSyncTable;
