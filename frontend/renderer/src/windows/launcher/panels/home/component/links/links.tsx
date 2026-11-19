/**
 * @author Valkream Team
 * @license MIT-NC
 */

import "./css/links.css";

import { DiscordIcon, WebIcon, TopServerIcon } from "./svgs";
import type { LinkProps } from "./links.types";
import { ButtonBase } from "@mui/material";
import { useGames } from "../../../../context/games.context";

function Link({ url, icon }: LinkProps) {
  if (!window.electron_API.openLink) return null;

  return (
    <ButtonBase
      classes={{ root: "link" }}
      onClick={() => window.electron_API.openLink(url)}
    >
      {icon}
    </ButtonBase>
  );
}

function Links() {
  // Liens décrits par la config render de l'instance : un lien absent n'est pas affiché
  const { actualInstance } = useGames();
  const { discord, site, topserver } = actualInstance.links ?? {};

  return (
    <div className="links">
      {discord && <Link url={discord} icon={<DiscordIcon />} />}
      {site && <Link url={site} icon={<WebIcon />} />}
      {topserver && (
        <Link
          url={topserver}
          icon={
            <TopServerIcon sx={{ transform: "scale(2.4) translate(0,30%)" }} />
          }
        />
      )}
    </div>
  );
}

export default Links;
