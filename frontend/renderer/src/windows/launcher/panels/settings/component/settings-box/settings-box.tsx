/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./settings-box.css";
import type { SettingsBoxProps } from "./settings-box.types";

const SettingsBox = ({ text, children, warn, sx, layout }: SettingsBoxProps) => {
  const mode = layout ?? (text ? "row" : "column");
  return (
    <div className={`settings-elements-box ${mode} ${warn ? "warn" : ""}`} style={sx}>
      {text && <span className="setting-text">{text}</span>}
      <div className="settings-elements">{children}</div>
    </div>
  );
};

export default SettingsBox;
