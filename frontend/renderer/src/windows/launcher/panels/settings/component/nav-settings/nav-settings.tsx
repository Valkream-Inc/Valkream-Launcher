/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React from "react";
import type { MouseEvent } from "react";
import "./css/nav-settings.css";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

import { usePanels } from "../../../../context/panels.context";
import { useGames } from "../../../../context/games.context";
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
  onToogleSpecialOption,
}: NavSettingsProps) => {
  const { changePanel } = usePanels();
  const { actualInstance } = useGames();

  const handleToogleSpecialOptionClick = (e: MouseEvent<HTMLImageElement>) => {
    // ctrl + shift click pour rendre les options spéciaux visibles
    if (e.ctrlKey && e.shiftKey) {
      onToogleSpecialOption();
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
        src={`./images/${actualInstance.assets}-icon-with-name.png`}
        alt="Logo Valkream"
        className="menu-header"
      />
      <div className="menu-header">Paramètres</div>

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
        label="Sauvegarder"
        active={false}
        onClick={redirectToSave}
      />
    </Box>
  );
};
