import ButtonsBar from "./component/buttons-bar/buttons-bar";
import ServerInfo from "./component/server-info/server-info";
import Links from "./component/links/links";

function Home() {
  return (
    <>
      <ServerInfo />
      <Links />
      <ButtonsBar />
    </>
  );
}

export default Home;
