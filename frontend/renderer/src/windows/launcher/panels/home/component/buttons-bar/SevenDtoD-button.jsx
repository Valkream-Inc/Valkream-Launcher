/**
 * @author Valkream Team
 * @license MIT-NC
 */

import React from "react";

import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import { ButtonBase, Stack } from "@mui/material";

import { useAction } from "../../../../context/action.context";
import { useInfos } from "../../../../context/infos.context";

export default function SevenDtoDButton() {
  const { actionLoading } = useAction();
  const { maintenance } = useInfos();

  const handleClick = async () => {
    const launcherBehavior = "nothing";

    window.electron_API.openLink("steam://rungameid/251570");
    if (launcherBehavior !== "nothing") window.electron_API.close();
  };

  return (
    <>
      <ButtonBase
        onClick={handleClick}
        className="play-btn"
        disabled={actionLoading}
        disableRipple={actionLoading}
      >
        <Stack direction={"row"} spacing={1} sx={{ alignItems: "center" }}>
          <SportsEsportsIcon fontSize="large" className="icon-play" />
          Jouer
          <br />
          (7days.valkream.com)
          {maintenance?.enabled && (
            <>
              <br /> (⚠️ Maintenance en cours.)
            </>
          )}
        </Stack>
      </ButtonBase>
    </>
  );
}
