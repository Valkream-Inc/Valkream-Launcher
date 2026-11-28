/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useTranslation } from "react-i18next";

import "./settings-title.css";
import type { SettingsTitleProps } from "./settings-title.types";

const SettingsTitle = ({ children, warn, scope, scopeDetail }: SettingsTitleProps) => {
  const { t } = useTranslation();
  return (
    <div className={`titre-tab ${warn ? "warn" : ""}`}>
      <span>{children}</span>
      {scope && (
        <span className={`scope-chip scope-${scope}`}>
          {t(`scope.${scope}`)}
          {scopeDetail ? ` · ${scopeDetail}` : ""}
        </span>
      )}
    </div>
  );
};

export default SettingsTitle;
