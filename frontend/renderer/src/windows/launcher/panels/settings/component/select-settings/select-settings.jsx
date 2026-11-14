/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { MenuItem, Select } from "@mui/material";
import "./select-settings.css";

import { useTheme } from "../../../../context/theme.context";

export function SelectSettings({ children, MenuProps, className, ...props }) {
  const { theme } = useTheme();

  return (
    <Select
      fullWidth
      {...props}
      className={["select-root", className].filter(Boolean).join(" ")}
      MenuProps={{
        ...MenuProps,
        slotProps: {
          ...MenuProps?.slotProps,
          paper: {
            ...MenuProps?.slotProps?.paper,
            className: `${theme}-theme`,
            sx: {
              background: "var(--background)",
              border: "var(--color) 2px solid",
              borderRadius: "10px",
              boxShadow: "none",
              ...MenuProps?.slotProps?.paper?.sx,
            },
          },
        },
      }}
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
