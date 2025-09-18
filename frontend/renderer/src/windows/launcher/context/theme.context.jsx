import { createContext, useState, useContext, useEffect } from "react";

export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("modern");

  const changeTheme = async (value) => {
    const themes = ["old", "modern", "futuristic"];
    if (!themes.includes(value)) throw new Error("Invalid theme value");

    await window.electron_API.setSettings("launcherTheme", value);
    return setTheme(value);
  };

  useEffect(() => {
    const loadSettings = async () => {
      const launcherTheme = await window.electron_API.getSettings(
        "launcherTheme"
      );
      if (launcherTheme && launcherTheme !== theme) changeTheme(launcherTheme);
    };

    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      <span className={`${theme}-theme`}>{children}</span>
    </ThemeContext.Provider>
  );
};
