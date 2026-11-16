/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { memo } from "react";
import FuturisticPopup from "./popup.futuristic";
import ModernPopup from "./popup.modern";
import OldPopup from "./popup.old";

import { useTheme } from "../../context/theme.context";
import type { PopupProps } from "./popup.types";

const Popup = (props: PopupProps) => {
  const { theme } = useTheme();
  if (theme === "futuristic") return <FuturisticPopup {...props} />;
  if (theme === "old") return <OldPopup {...props} />;
  return <ModernPopup {...props} />;
};

export default memo(Popup);
