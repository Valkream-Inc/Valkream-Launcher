/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import "./settings-box.css";

const SettingsBox = ({ text, children, warn, sx }) => {
  return (
    <div className={`settings-elements-box ${warn ? "warn" : ""}`} style={sx}>
      {text && <span className="setting-text">{text}</span>}
      <div className="settings-elements content-center">{children}</div>
    </div>
  );
};

export default SettingsBox;
