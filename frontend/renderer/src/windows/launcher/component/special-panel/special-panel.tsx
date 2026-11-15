/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { memo } from "react";
import SpecialPanelFuturistic from "./futuristic/special-panel.futuristic";
import SpecialPanelModern from "./special-panel.modern";
import SpecialPanelOld from "./special-panel.old";

import type {
  SpecialPanelProps,
  SpecialPanelType,
} from "./special-panel.types";
import { useTheme } from "../../context/theme.context";

const alertData: Record<
  SpecialPanelType,
  { title: string; paragraph: string }
> = {
  error: {
    title: "Erreur Critique",
    paragraph:
      "Un problème grave est survenu. Vous devez redémarrer votre launcher. Si le probléme persiste veuillez contacter l'équipe d'administration !",
  },
  warning: {
    title: "Attention",
    paragraph:
      "Une mise à jour importante est disponible. Souhaitez-vous la télécharger ?",
  },
  info: {
    title: "Information",
    paragraph:
      "Le serveur est actuellement en ligne et opérationnel. Veuillez vous connecter pour jouer.",
  },
};

function SpecialPanel(props: SpecialPanelProps) {
  const { theme } = useTheme();

  const type = props.type;
  const title = props.title || alertData[type].title;
  const paragraph = props.paragraph || alertData[type].paragraph;

  if (theme === "futuristic")
    return (
      <SpecialPanelFuturistic {...props} paragraph={paragraph} title={title} />
    );

  if (theme === "old")
    return <SpecialPanelOld {...props} paragraph={paragraph} title={title} />;

  return <SpecialPanelModern {...props} paragraph={paragraph} title={title} />;
}

export default memo(SpecialPanel);
