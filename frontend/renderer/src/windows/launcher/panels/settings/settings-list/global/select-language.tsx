/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useTranslation } from "react-i18next";
import { enqueueSnackbar } from "notistack";

import { languageOf, setLanguage, LANGUAGES } from "../../../../../../i18n";
import {
  SelectItemSettings,
  SelectSettings,
} from "../../component/select-settings/select-settings";
import SettingsBox from "../../component/settings-box/settings-box";

function SelectLanguage() {
  const { t, i18n } = useTranslation();
  const current = languageOf(i18n.language);

  const handleChange = async (event: { target: { value: unknown } }) => {
    const value = languageOf(event.target.value);
    if (value === current) return;
    await setLanguage(value);
    enqueueSnackbar(i18n.t("language.changed"), { variant: "info" });
  };

  return (
    <SettingsBox warn={false} text={t("language.text")}>
      <SelectSettings value={current} onChange={handleChange}>
        {LANGUAGES.map((language) => (
          <SelectItemSettings key={language} value={language}>
            {t(`language.${language}`)}
          </SelectItemSettings>
        ))}
      </SelectSettings>
    </SettingsBox>
  );
}

export default SelectLanguage;
