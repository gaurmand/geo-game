class Settings {
  static getSettings() {
    let settings = Settings.retrieveSettings();
    return settings ? settings : Settings.DEFAULT;
  }

  static retrieveSettings() {
    return JSON.parse(localStorage.getItem('game-settings'))
  }

  static saveSettings(settings) {
    localStorage.setItem('game-settings', JSON.stringify(settings));
  }
}

Settings.GAME_MODE = {
  COUNTRIES: 1,
  CITIES: 2
};

Settings.GAME_DIFFICULTY = {
  EASY: 1,
  NORMAL: 2,
  HARD: 3
};

Settings.DEFAULT = {
  GAME_MODE: Settings.GAME_MODE.COUNTRIES,
  GAME_DIFFICULTY: Settings.GAME_DIFFICULTY.NORMAL
};

module.exports = Settings;