/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./settings-title.css";
import type { SettingsTitleProps } from "./settings-title.types";

const SettingsTitle = ({ children, warn }: SettingsTitleProps) => {
  return <div className={`titre-tab ${warn ? "warn" : ""}`}>{children}</div>;
};

export default SettingsTitle;
