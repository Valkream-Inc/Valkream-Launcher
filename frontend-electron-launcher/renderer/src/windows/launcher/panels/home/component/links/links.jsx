import React from "react";
import "./css/links.css";

import { DiscordIcon, WebIcon, TopServerIcon } from "./svgs.jsx";
import { ButtonBase } from "@mui/material";

function Link({ url, icon }) {
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
  return (
    <div className="links">
      <Link
        url="https://discord.com/invite/zn3TsumtyG"
        icon={<DiscordIcon />}
      />
      <Link url="https://valkream.com" icon={<WebIcon />} />
      <Link
        url="https://top-serveurs.net/valheim/vote/valheim-valkream"
        icon={
          <TopServerIcon sx={{ transform: "scale(2.4) translate(0,30%)" }} />
        }
      />
    </div>
  );
}

export default Links;
