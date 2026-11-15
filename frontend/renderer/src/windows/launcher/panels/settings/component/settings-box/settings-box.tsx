/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./settings-box.css";
import type { SettingsBoxProps } from "./settings-box.types";

const SettingsBox = ({ text, children, warn, sx }: SettingsBoxProps) => {
  return (
    <div className={`settings-elements-box ${warn ? "warn" : ""}`} style={sx}>
      {text && <span className="setting-text">{text}</span>}
      <div className="settings-elements content-center">{children}</div>
    </div>
  );
};

export default SettingsBox;
