const bepInExUrl = {
  win32:
    "https://github.com/BepInEx/BepInEx/releases/download/v5.4.23.3/BepInEx_win_x64_5.4.23.3.zip",
  linux:
    "https://github.com/BepInEx/BepInEx/releases/download/v5.4.23.3/BepInEx_linux_x64_5.4.23.3.zip",
  darwin:
    "https://github.com/BepInEx/BepInEx/releases/download/v5.4.23.3/BepInEx_macos_x64_5.4.23.3.zip",
};

const platform = process.platform;

module.exports = bepInExUrl[platform];
