import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Copyright from "./windows/launcher/component/copyright/copyright.jsx";
import SpecialPanel from "./windows/launcher/component/special-panel/special-panel.jsx";
import WindowsBar from "./windows/launcher/component/windows-bar/windows-bar.jsx";
import { ThemeProvider } from "./windows/launcher/context/theme.context.jsx";
import Launcher from "./windows/launcher/launcher.jsx";

const ErrorPage = () => {
  return (
    <ThemeProvider>
      <WindowsBar />
      <SpecialPanel type="error" />
      <Copyright />
    </ThemeProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Launcher />,
    errorElement: <ErrorPage />,
  },
  // {
  //   path: "/settings",
  //   element: <Settings />,
  //   errorElement: <SpecialPanel type="error" />,
  // },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
