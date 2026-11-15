/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { MenuItem, Select } from "@mui/material";
import "./select-settings.css";

import { useTheme } from "../../../../context/theme.context";
import type {
  SelectItemSettingsProps,
  SelectSettingsProps,
} from "./select-settings.types";

export function SelectSettings<T = unknown>({
  children,
  MenuProps,
  className,
  ...props
}: SelectSettingsProps<T>) {
  const { theme } = useTheme();
  // `paper` peut être un objet ou une fonction : seul l'objet porte `sx`
  const rawPaper = MenuProps?.slotProps?.paper;
  const paperProps = typeof rawPaper === "object" ? rawPaper : undefined;

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
            ...paperProps,
            className: `${theme}-theme`,
            sx: {
              background: "var(--background)",
              border: "var(--color) 2px solid",
              borderRadius: "10px",
              boxShadow: "none",
              ...paperProps?.sx,
            },
          },
        },
      }}
    >
      {children}
    </Select>
  );
}

export function SelectItemSettings({
  children,
  ...props
}: SelectItemSettingsProps) {
  const { theme } = useTheme();

  return (
    <MenuItem {...props} className={`select-item ${theme}-theme`}>
      {children}
    </MenuItem>
  );
}
