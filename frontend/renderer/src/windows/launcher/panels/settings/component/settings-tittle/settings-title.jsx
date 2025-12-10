/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./settings-title.css";

const SettingsTitle = ({ children, warn }) => {
  return <div className={`titre-tab ${warn ? "warn" : ""}`}>{children}</div>;
};

export default SettingsTitle;
