import "./settings-box.css";

export const SettingsBox = ({ text, children, warn }) => {
  return (
    <div className={`settings-elements-box ${warn ? "warn" : ""}`}>
      <span className="setting-text">{text}</span>
      {children}
    </div>
  );
};
