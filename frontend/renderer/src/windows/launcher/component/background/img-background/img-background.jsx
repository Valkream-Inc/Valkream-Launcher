/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

import { useMemo, memo } from "react";
import { useGames } from "../../../context/games.context.jsx";

function ImgBackground() {
  const { actualGame } = useGames();

  const backgroundSrc = useMemo(() => {
    return `./images/${actualGame}-background.png`;
  }, [actualGame]);

  const altText = useMemo(() => `${actualGame} background`, [actualGame]);

  return <img src={backgroundSrc} alt={altText} className="background" />;
}

export default memo(ImgBackground);
