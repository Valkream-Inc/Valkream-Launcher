/**
 * @author Valkream Team
 * @license MIT-NC
 */

import TablePagination from "@mui/material/TablePagination";
import React from "react";

const ModsSyncPagination = ({
  processedMods,
  themeStyles,
  page,
  setPage,
  rowsPerPage,
  setRowsPerPage,
}) => {
  return (
    <TablePagination
      rowsPerPageOptions={[50, 100, 250]}
      component="div"
      count={processedMods.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={(event, newPage) => setPage(newPage)}
      onRowsPerPageChange={(event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
      }}
      SelectProps={{
        MenuProps: {
          PaperProps: {
            sx: {
              backgroundColor: themeStyles.tableBg,
              color: themeStyles.textPrimary,
              border: `solid 1px ${themeStyles.borderColor} !important`,

              "& .MuiMenuItem-root": {
                color: themeStyles.textPrimary,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                },
              },
              "& .Mui-selected": {
                backgroundColor: "rgba(255, 255, 255, 0.1) !important",
              },
            },
          },
        },
      }}
      showFirstButton={true}
      showLastButton={true}
      labelRowsPerPage="Lignes par page:"
      sx={{
        color: themeStyles.textPrimary,
        background: themeStyles.headerBg,

        "& .MuiSelect-icon": {
          color: themeStyles.textPrimary,
        },
        "& .MuiIconButton-root": {
          color: themeStyles.textPrimary,
        },
        "& .Mui-disabled": {
          color: themeStyles.textPrimary,
          opacity: 0.5,
        },
        "& .MuiSelect-select": {
          color: themeStyles.textPrimary,
        },
      }}
    />
  );
};

export default ModsSyncPagination;
