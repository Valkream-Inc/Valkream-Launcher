/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { CSSProperties, ReactElement, ReactNode } from "react";
import type { TransitionProps } from "@mui/material/transitions";
import type { LauncherTheme } from "@shared/types";

export type PopupType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "event"
  | "tips"
  | "welcome";

/** Callback de confirmation, ou tableau `[callback, texte du bouton]`. */
export type PopupConfirm = (() => void) | [() => void, string?];

export interface PopupProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: PopupConfirm;
  type?: PopupType;
  title?: string;
  message?: ReactNode;
}

export interface PopupButton {
  text: string;
  action: () => void;
  variant: "main" | "secondary";
}

/** Configuration d'un type de popup (une valeur par thème). */
export interface PopupTypeConfig {
  color: Record<LauncherTheme, string>;
  icon: Record<LauncherTheme, ReactNode>;
  iconSize: { futuristic: number };
  titleSize: { futuristic: string };
  textSize: { futuristic: string };
}

export type PopupTypeConfigMap = Record<PopupType, PopupTypeConfig>;

/** Props de la transition Slide partagée par les popups. */
export type PopupTransitionProps = TransitionProps & {
  children: ReactElement<unknown>;
};

export interface AnimatedRunesProps {
  type: PopupType;
}

export interface PopupDecorationProps {
  type: PopupType;
}

/** Style d'une ligne ou d'un noeud décoratif du popup futuriste. */
export type PopupDecorationStyle = CSSProperties;

export interface PopupDecorations {
  lines: PopupDecorationStyle[];
  nodes: PopupDecorationStyle[];
}
