const Settings = require('../game/settings');

class GameSetup {
  constructor(overlay, startCb, backCb) {
    this.overlay = overlay;
    this.settings = Settings.getSettings();

    this.containerNode = this.overlay.append('div')
      .classed('geo-container setup-container fade', true)
      .style('opacity', '0')
      .style('visibility', 'hidden');

    this.gameSettings = this.containerNode.append('div')
      .classed('game-settings', true)

    //game mode
    this.gameMode = this.gameSettings.append('div')
      .classed('game-mode', true)

    this.gameMode.append('p')
      .text('Game Mode')

    this.gameModeOptions = this.gameMode.append('div')
      .classed('options', true)

    this.countriesMode = this.gameModeOptions.append('button')
      .classed('geo-button', true)
      .text('Countries')
      .on('click', () => this.setGameMode(Settings.GAME_MODE.COUNTRIES));

    this.citiesMode = this.gameModeOptions.append('button')
      .classed('geo-button', true)
      .text('Cities')
      .attr('disabled', true) //not implemented
      .on('click', () => this.setGameMode(Settings.GAME_MODE.CITIES));

    //game difficulty
    this.gameDifficulty = this.gameSettings.append('div')
      .classed('game-difficulty', true)

    this.gameDifficulty.append('p')
      .text('Difficulty')

    this.gameDifficultyOptions = this.gameDifficulty.append('div')
      .classed('options', true)

    this.easyButton = this.gameDifficultyOptions.append('button')
      .classed('geo-button', true)
      .text('Easy')
      .on('click', () => this.setGameDifficulty(Settings.GAME_DIFFICULTY.EASY));

    this.normalButton = this.gameDifficultyOptions.append('button')
      .classed('geo-button', true)
      .text('Normal')
      .on('click', () => this.setGameDifficulty(Settings.GAME_DIFFICULTY.NORMAL));

    this.hardButton = this.gameDifficultyOptions.append('button')
      .classed('geo-button', true)
      .text('Hard')
      .on('click', () => this.setGameDifficulty(Settings.GAME_DIFFICULTY.HARD));

    //start or back
    this.buttons = this.gameSettings.append('div')
      .classed('nav-buttons', true)

    this.startGame = this.buttons.append('button')
      .classed('geo-button', true)
      .text('Start')
      .on('click', () => {
        this.saveSettings();
        if(startCb)
          startCb();
      })

    this.back = this.buttons.append('button')
      .classed('geo-button', true)
      .text('Back')
      .on('click', () => {
        this.saveSettings();
        if(backCb)
          backCb();
      })
  }

  initialize() {
    this.setGameMode(this.settings.GAME_MODE);
    this.setGameDifficulty(this.settings.GAME_DIFFICULTY);
  }

  setGameMode(gameMode) {
    this.settings.GAME_MODE = gameMode;

    this.citiesMode.classed('active', false);
    this.countriesMode.classed('active', false);

    switch(gameMode) {
      case Settings.GAME_MODE.COUNTRIES:
        this.countriesMode.classed('active', true);
        break;
      case Settings.GAME_MODE.CITIES:
        this.citiesMode.classed('active', true);
        break;
    }
  }

  setGameDifficulty(gameDifficulty) {
    this.settings.GAME_DIFFICULTY = gameDifficulty;

    this.easyButton.classed('active', false);
    this.normalButton.classed('active', false);
    this.hardButton.classed('active', false);

    switch(gameDifficulty) {
      case Settings.GAME_DIFFICULTY.EASY:
        this.easyButton.classed('active', true);
        break;
      case Settings.GAME_DIFFICULTY.NORMAL:
        this.normalButton.classed('active', true);
        break;
      case Settings.GAME_DIFFICULTY.HARD:
        this.hardButton.classed('active', true);
        break;
    }
  }

  saveSettings() {
    Settings.saveSettings(this.settings);
  }

  show() {
    this.containerNode.style('opacity', '1');
    this.containerNode.style('visibility', 'visible');

    this.initialize();
  }

  hide() {
    this.containerNode.style('opacity', '0');
    this.containerNode.style('visibility', 'hidden');
  }

  node() {
    return this.containerNode.node();
  }
}

module.exports = GameSetup;