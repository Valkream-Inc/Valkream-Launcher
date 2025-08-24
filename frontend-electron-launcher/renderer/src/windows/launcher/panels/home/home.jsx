import ButtonsBar from "./component/buttons-bar/buttons-bar";
import ServerInfo from "./component/server-info/server-info";
import Links from "./component/links/links";

import { usePanels } from "../../context/panels.context";

function Home() {
  const { changePanel } = usePanels();
  return (
    <>
      <ServerInfo />
      <Links />
      <ButtonsBar onSettingsClick={() => changePanel("alert")} />
    </>
  );
}

export default Home;
