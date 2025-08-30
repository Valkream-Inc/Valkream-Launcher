import React from "react";
import Launcher from "./windows/launcher/launcher.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Launcher />} />
        {/* <Route path="/settings" element={<Settings />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
