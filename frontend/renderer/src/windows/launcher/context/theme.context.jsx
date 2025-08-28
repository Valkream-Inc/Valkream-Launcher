import { createContext, useState, useContext } from "react";

export const ThemeContext = createContext();
export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("modern");

  const changeTheme = (value) => {
    const themes = ["old", "modern", "futuristic"];
    if (!themes.includes(value)) throw new Error("Invalid theme value");

    setTheme(value);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      <span className={`${theme}-theme`}>{children}</span>
    </ThemeContext.Provider>
  );
};
