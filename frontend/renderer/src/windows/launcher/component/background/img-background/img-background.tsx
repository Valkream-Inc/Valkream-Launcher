/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useMemo, memo } from "react";
import { useGames } from "../../../context/games.context";

function ImgBackground() {
  const { actualInstance } = useGames();

  const backgroundSrc = actualInstance.background.image;

  const altText = useMemo(() => `${actualInstance.name} background`, [actualInstance.name]);

  return <img src={backgroundSrc} alt={altText} className="background" />;
}

export default memo(ImgBackground);
