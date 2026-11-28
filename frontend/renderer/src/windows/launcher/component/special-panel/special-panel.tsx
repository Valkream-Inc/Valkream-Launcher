/**
 * @author Valkream Team
 * @license MIT-NC
 */

import SpecialPanelFuturistic from "./futuristic/special-panel.futuristic";
import SpecialPanelModern from "./special-panel.modern";
import SpecialPanelOld from "./special-panel.old";

import type { SpecialPanelProps } from "./special-panel.types";
import { useTheme } from "../../context/theme.context";
import { useTranslation } from "react-i18next";

function SpecialPanel(props: SpecialPanelProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const type = props.type ?? "info";
  const title = props.title || t(`panel.${type}.title`);
  const paragraph = props.paragraph || t(`panel.${type}.text`);

  if (theme === "futuristic")
    return (
      <SpecialPanelFuturistic {...props} paragraph={paragraph} title={title} />
    );

  if (theme === "old")
    return <SpecialPanelOld {...props} paragraph={paragraph} title={title} />;

  return <SpecialPanelModern {...props} paragraph={paragraph} title={title} />;
}

export default SpecialPanel;
