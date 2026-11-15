/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { MenuItemProps } from "@mui/material";
import type { SelectProps } from "@mui/material/Select";
import type { ReactNode } from "react";

export type SelectSettingsProps<T = unknown> = SelectProps<T> & {
  children?: ReactNode;
};

export type SelectItemSettingsProps = MenuItemProps;
