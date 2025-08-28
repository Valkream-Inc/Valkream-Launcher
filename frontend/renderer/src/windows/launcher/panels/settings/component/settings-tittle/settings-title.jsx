import "./settings-title.css";

export const SettingsTitle = ({ children, warn }) => {
  return <div className={`titre-tab ${warn ? "warn" : ""}`}>{children}</div>;
};
