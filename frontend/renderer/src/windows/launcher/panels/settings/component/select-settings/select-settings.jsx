/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { MenuItem, Select } from "@mui/material";
import React from "react";
import "./select-settings.css";

import { useTheme } from "../../../../context/theme.context";

export function SelectSettings({ children, ...props }) {
  const { theme } = useTheme();

  return (
    <Select
      className="select-root"
      fullWidth
      MenuProps={{
        PaperProps: {
          className: `${theme}-theme`,
          style: {
            background: "var(--background)",
            boxShadow: "none",
          },
        },
      }}
      {...props}
    >
      {children}
    </Select>
  );
}

export function SelectItemSettings({ children, ...props }) {
  const { theme } = useTheme();

  return (
    <MenuItem {...props} className={`select-item ${theme}-theme`}>
      {children}
    </MenuItem>
  );
}
