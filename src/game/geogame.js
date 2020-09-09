const d3 = require("d3");
const GeoGlobe = require('../globe/geoglobe'); 
const {QuestionSet} = require("./questions");
const Settings = require('../game/settings');

const StartOverlay = require('../ui/startoverlay');
const GameInfoBar = require('../ui/gameinfobar');
const FPSCounter = require('../ui/fpscounter');
const QuestionResult = require('../ui/questionresult');
const EndOverlay = require("../ui/endoverlay");
const GameSetup = require("../ui/gamesetup");
const About = require("../ui/about");

class GeoGame {
  constructor() {
    this.globe = new GeoGlobe();
    this.globe.draw();

    this.overlay = d3.create('div')
      .classed('overlay', true);

    this.gameInfoBar = new GameInfoBar(this.overlay);

    this.startOverlay = new StartOverlay(this.overlay, () => {
      this.startOverlay.hide();
      this.gameInfoBar.show();
      this.globe.moveToGamePosition();
      this.globe.enableInteraction();
      this.startGame();
    }, () => {
      this.startOverlay.hide();
      this.setup.show();
    }, () => {
      this.startOverlay.hide();
      this.about.show();
    });

    this.setup = new GameSetup(this.overlay, () => {
      this.setup.hide();
      this.gameInfoBar.show();
      this.globe.moveToGamePosition();
      this.globe.enableInteraction();
      this.startGame();
    }, () => {
      this.setup.hide();
      this.startOverlay.show();
    });

    this.about = new About(this.overlay, () => {
      this.about.hide();
      this.startOverlay.show();
    });

    this.fpsCounter = new FPSCounter(this.overlay);

    this.endOverlay = new EndOverlay(this.globe, this.overlay, () => {
      //play again
      this.endOverlay.hide();
      this.startGame();
    }, () => {
      //show start overlay
      this.globe.disableInteraction();
      this.globe.moveToStartPosition();
      this.gameInfoBar.hide();
      this.endOverlay.hide();

      this.globe.zoomOut(() => {
        this.startOverlay.show();
        this.globe.startAutoRotate();
      });
    });

    this.questions = null;
    this.numQuestions = 0;
    this.currQuestion = 0;
    this.score = 0;

    setInterval(() => {
      this.updateFPSCounter();
    }, GeoGame.FPS_UPDATE_INTERVAL);
  }

  append() {
    document.body.appendChild(this.globe.node());
    document.body.appendChild(this.overlay.node());

    this.globe.moveToStartPosition();
    this.startOverlay.show();
    // this.globe.startAutoRotate();
  }

  updateFPSCounter() {
    if(this.globe.numDraws) {
      let fps = 1000 * this.globe.numDraws / GeoGame.FPS_UPDATE_INTERVAL ;
      this.fpsCounter.setFPS(Math.round(fps));
    } else
      this.fpsCounter.setFPS('idle');

    this.globe.clearStats();
  }

  startGame() {
    let difficulty = Settings.getSettings().GAME_DIFFICULTY;
    this.setDifficulty(difficulty);

    let numQuestions = this.getNumQuestions();
    this.questions = new QuestionSet(numQuestions, difficulty);
    this.numQuestions = numQuestions;
    this.currQuestion = 0;
    this.score = 0;

    this.startRound();
  }

  endGame() {
    this.globe.onclick = null;
    this.updateOverlay('-', null, null, true);

    this.globe.disableHighlightMode();
    this.endOverlay.setQuestionResults(this.questions);

    this.globe.zoomOut(() => {
      this.endOverlay.setPosition(this.globe.getMapBBox());
      this.endOverlay.show();
    });
  }

  startRound() {
    let question = this.questions.getQuestion(this.currQuestion);

    this.globe.enableHighlightMode();
    this.updateOverlay(question.getCountryName(), this.currQuestion+1, this.score);

    this.gameInfoBar.startTimer(this.getQuestionTime(), () => {
      this.globe.on('click', null);
      this.globe.disableHighlightMode();
      this.handleQuestionResponse(question);
    });

    this.globe.on('click', (lonlat, country) => {
      this.globe.on('click', null);
      this.gameInfoBar.stopTimer();
      this.globe.disableHighlightMode();
      this.handleQuestionResponse(question, lonlat, country);
    });
  }

  handleQuestionResponse(question, lonlat, country) {
    let questionScore = question.answer(lonlat, country);

    this.globe.highlightCountry(question.getQuestionCountry(), 'green');

    if(question.isCorrect()) {
      //correct country clicked
      this.score += questionScore.total;
      this.updateOverlay(null, null, this.score);
    } else if(question.getAnswerCountry())
      //wrong country clicked
      this.globe.highlightCountry(question.getAnswerCountry(), 'red');

    if(question.getClosestPoint())
      this.globe.addLine(lonlat, question.getClosestPoint())

    if(!question.isCorrect() && lonlat) {
      this.globe.addPoint(lonlat);
      this.globe.addPoint(question.getClosestPoint());
    }
    
    this.globe.draw(); //country highlighting transitions play

    //after transitions finish, rotate globe to show correct country
    setTimeout(() => {
      this.globe.rotateToLocation(question.getCentroid(), () => {
        //show results dialog after rotating
        let qr = new QuestionResult(this.globe, question, () => {
          this.globe.clearHighlightedCountries();
          this.globe.clearLines();
          this.globe.clearPoints();
          this.globe.draw();
          qr.hide();
          qr.remove();

          if(++this.currQuestion < this.numQuestions)
            //still more rounds to go
            this.startRound();
          else
            //last round finished
            this.endGame();
        });

        qr.setInitialPosition();
        qr.show();
      });
    }, GeoGame.RESULTS_ROTATE_DELAY);
  }

  updateOverlay(question, round, score, gameover) {
    if(question)
      this.gameInfoBar.setQuestion(question);
    if(round)
      this.gameInfoBar.setRound(round + '/' + this.numQuestions);
    if(score !== null)
      this.gameInfoBar.setScore(score.toString());

    if(gameover)
      this.gameInfoBar.setPrompt(GameInfoBar.END_GAME_PROMPT);
    else
      this.gameInfoBar.setPrompt(GameInfoBar.QUESTION_PROMPT);
  }

  setDifficulty(gameDifficulty) {
    this.difficulty = gameDifficulty;
  }

  getNumQuestions() {
    return GeoGame.getDifficultyMode(this.difficulty).NUM_QUESTIONS;
  }


  getQuestionTime() {
    return GeoGame.getDifficultyMode(this.difficulty).QUESTION_TIME;
  }

  static getDifficultyMode(gameDifficulty) {
    switch(gameDifficulty) {
      case Settings.GAME_DIFFICULTY.EASY:
        return GeoGame.EASY_MODE;
      case Settings.GAME_DIFFICULTY.NORMAL:
        return GeoGame.NORMAL_MODE;
      case Settings.GAME_DIFFICULTY.HARD:
        return GeoGame.HARD_MODE;
    }
  }
}

GeoGame.RESULTS_ROTATE_DELAY = 300;
GeoGame.FPS_UPDATE_INTERVAL = 500;

GeoGame.EASY_MODE = {
  QUESTION_TIME: 30,
  NUM_QUESTIONS: 5
};

GeoGame.NORMAL_MODE = {
  QUESTION_TIME: 15,
  NUM_QUESTIONS: 10
};

GeoGame.HARD_MODE = {
  QUESTION_TIME: 5,
  NUM_QUESTIONS: 25
};

module.exports = GeoGame;