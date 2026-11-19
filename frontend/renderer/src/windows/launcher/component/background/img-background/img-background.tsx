/**
 * @author Valkream Team
 * @license MIT-NC
 */

import { useMemo, memo } from "react";
import { useGames } from "../../../context/games.context";

function ImgBackground() {
  const { actualInstance } = useGames();

  const backgroundSrc = useMemo(() => {
    return `./images/${actualInstance.assets}-background.png`;
  }, [actualInstance.assets]);

  const altText = useMemo(() => `${actualInstance.name} background`, [actualInstance.name]);

  return <img src={backgroundSrc} alt={altText} className="background" />;
}

export default memo(ImgBackground);
