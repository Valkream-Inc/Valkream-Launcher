/**
 * @author Valkream Team
 * @license MIT-NC
 */

import type { MouseEvent } from "react";
import React from "react";
import "./css/nav-settings.css";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { useTranslation } from "react-i18next";
import { useGames } from "../../../../context/games.context";
import { usePanels } from "../../../../context/panels.context";
import type { NavButtonProps, NavSettingsProps } from "./nav-settings.types";

export const NavButton = ({
  id,
  label,
  active,
  onClick = () => {},
}: NavButtonProps) => {
  return (
    <Button
      id={id}
      className={`nav-settings-btn ${active ? "active-settings-BTN" : ""}`}
      onClick={() => onClick(id)}
      variant="outlined"
    >
      {label}
    </Button>
  );
};

export const NavSettings = ({
  onSave,
  children,
  activeTab,
  setActiveTab,
  ToggleIsConfirmAdminVisible,
  ToolBar,
}: NavSettingsProps) => {
  const { t } = useTranslation();
  const { changePanel } = usePanels();
  const { actualInstance } = useGames();

  const handleToogleSpecialOptionClick = (e: MouseEvent<HTMLImageElement>) => {
    // ctrl + shift click pour rendre les options spéciaux visibles
    if (e.ctrlKey && e.shiftKey) {
      ToggleIsConfirmAdminVisible();
    }
  };

  const handleClick = (id: string) => {
    setActiveTab(id);
  };

  const redirectToSave = () => {
    if (onSave()) onSave();
    changePanel("home");
  };

  return (
    <Box className="nav-settings">
      {/* Header */}
      <img
        onClick={handleToogleSpecialOptionClick}
        src={actualInstance.images.iconWithName}
        alt="Logo Valkream"
        className="menu-header"
      />
      <div className="menu-header">
        {t("nav.title")} {ToolBar}
      </div>

      {/* Boutons */}
      <Box className="nav-box">
        {React.Children.map(children, (child) => {
          if (React.isValidElement<NavButtonProps>(child) && child.props.id) {
            return React.cloneElement(child, {
              active: activeTab === child.props.id,
              onClick: handleClick,
            });
          }
          return child;
        })}
      </Box>
      <NavButton
        id="save"
        label={t("nav.save")}
        active={false}
        onClick={redirectToSave}
      />
    </Box>
  );
};
