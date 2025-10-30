/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import "./settings-title.css";

const SettingsTitle = ({ children, warn }) => {
  return <div className={`titre-tab ${warn ? "warn" : ""}`}>{children}</div>;
};

export default SettingsTitle;
