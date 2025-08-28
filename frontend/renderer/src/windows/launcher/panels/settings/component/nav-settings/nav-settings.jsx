import React from "react";
import "./css/nav-settings.css";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

import { usePanels } from "../../../../context/panels.context.jsx";

export const NavButton = ({ id, label, active, onClick }) => {
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
}) => {
  const { changePanel } = usePanels();

  const handleToogleSpecialOptionClick = (e) => {
    // ctrl + shift click pour rendre les options spéciaux visibles
    if (e.ctrlKey && e.shiftKey) onToogleSpecialOption();
  };

  const handleClick = (id) => {
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
        src={`${process.env.PUBLIC_URL}/images/icon-with-name.png`}
        alt="Logo Valkream"
        className="menu-header"
      />
      <div className="menu-header">Paramètres</div>

      {/* Boutons */}
      <Box className="nav-box">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.props.id) {
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
