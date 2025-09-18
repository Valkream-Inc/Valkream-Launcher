import FuturisticPopup from "./popup.futuristic.jsx";
import ModernPopup from "./popup.modern.jsx";
import OldPopup from "./popup.old.jsx";

import { useTheme } from "../../context/theme.context.jsx";

const Popup = (props) => {
  const { theme } = useTheme();
  if (theme === "futuristic") return <FuturisticPopup {...props} />;
  if (theme === "old") return <OldPopup {...props} />;
  return <ModernPopup {...props} />;
};

export default Popup;
