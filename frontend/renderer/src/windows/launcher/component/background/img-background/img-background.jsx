import { useGames } from "../../../context/games.context.jsx";

function ImgBackground() {
  const { actualGame } = useGames();

  return (
    <img
      src={`./images/${actualGame}-background.png`}
      alt="Valheim background"
      className="background"
    />
  );
}

export default ImgBackground;
