const d3 = require("d3");
const GeoGlobe = require('./globe/geoglobe'); 

const StartOverlay = require('./ui/startoverlay');
const GameInfoBar = require('./ui/gameinfobar');
const FPSCounter = require('./ui/fpscounter');
const QuestionResult = require('./ui/questionresult');

class GeoGame {
  constructor(geoData) {
    this.globe = new GeoGlobe();
    this.globe.draw();

    this.geoData = geoData;
    this.overlay = d3.create('div')
      .classed('overlay', true);

    this.gameInfoBar = new GameInfoBar(this.overlay);

    this.startOverlay = new StartOverlay(this.overlay, () => {
      this.startOverlay.hide();
      this.gameInfoBar.show();
      this.globe.moveToGamePosition();
      this.globe.enableInteraction();
      this.startGame();
    });

    this.fpsCounter = new FPSCounter(this.overlay);

    this.questionResult = new QuestionResult();

    this.questions = [];
    this.questionIndex = 0;
    this.round = 0;
    this.score = 0;
    this.maxRound = 0;


    setInterval(() => {
      this.updateFPSCounter();
    }, GeoGame.FPS_UPDATE_INTERVAL);
  }

  append() {
    document.body.appendChild(this.globe.node());
    document.body.appendChild(this.overlay.node());
    document.body.appendChild(this.questionResult.node());

    this.globe.moveToStartPosition();
    this.startOverlay.show();
    this.globe.startAutoRotate();
  }

  updateFPSCounter() {
    if(this.globe.numDraws) {
      let fps = 1000 * this.globe.numDraws / GeoGame.FPS_UPDATE_INTERVAL ;
      this.fpsCounter.setFPS(Math.round(fps));
    } else
      this.fpsCounter.setFPS('idle');

    this.globe.clearStats();
  }

  startGame(numQuestions = GeoGame.NUM_QUESTIONS_PER_GAME) {
    this.questions = this.generateQuestions(numQuestions);
    this.questionIndex = 0;
    this.round = 1;
    this.maxRound = numQuestions;
    this.score = 0;

    this.startRound();
  }

  endGame() {
    this.globe.onclick = null;
    this.updateOverlay('GG', null, null);

    setTimeout(() => {
      this.gameInfoBar.hide();
      this.globe.moveToEndPosition();
    }, 10000);
  }

  startRound() {
    this.globe.enableHighlightMode();
    let question = this.getQuestion(this.questionIndex);
    this.updateOverlay(question.properties.NAME, this.round, this.score);

    this.globe.on('click', (lonlat, country) => {
      this.globe.on('click', null);
      this.globe.disableHighlightMode();

      let results = this.computeResults(question, country);

      this.globe.highlightCountry(question.properties.ISO_A3, 'green');

      if(results.correct) {
        //correct country clicked
        this.score += results.total;
        this.updateOverlay(null, null, this.score);
      } else 
        //wrong country clicked
        this.globe.highlightCountry(country.properties.ISO_A3, 'red');

      this.globe.draw(); //country highlighting transitions play

      //after transitions finish, rotate globe to show correct country
      setTimeout(() => {
        this.globe.rotateToLocation(question, () => {
          //show results dialog after rotating
          this.showResults(question, results);
        });
      }, GeoGame.ROTATE_TO_CORRECT_COUNTRY_DELAY);

    });
  }

  computeResults(question, country) {
    let result = {
      correct: false,
      proximity: 0,
      adjacency: 0,
      total: 0
    };
    
    if(country.properties.ISO_A3 == question.properties.ISO_A3) {
      //correct country clicked
      result.adjacency = GeoGame.SCORE_PER_QUESTION;
      result.total = GeoGame.SCORE_PER_QUESTION;
      result.correct = true;
    }
    
    return result;
  }

  showResults(question, results) {
    let anchor = d3.geoCentroid(question);
    this.questionResult.setInfo(question.properties.NAME, results);

    //show initial results
    let screenPosition = this.getResultsPosition(anchor);
    this.questionResult.setPosition(screenPosition);
    this.questionResult.show();
    this.globe.draw();

    this.globe.on('draw', () => {
      //update results positions when globe is redrawn
      let screenPosition = this.getResultsPosition(anchor);
      this.questionResult.setPosition(screenPosition);
    });

    this.questionResult.onNext(() => {
      this.globe.clearHighlightedCountries();
      this.globe.draw();
      this.questionResult.hide();

      //stop updating results position
      this.globe.on('draw', null); 

      if(this.round < this.maxRound) {
        //still more rounds to go
        this.round++;
        this.questionIndex++;
        this.startRound();
      } else
        //last round finished
        this.endGame();
    });
  }

  getResultsPosition(anchor) {
    let screenPosition;

    if (this.globe.isPointVisible(anchor))
      screenPosition = this.globe.projection(anchor);
    else {
      let horizonPoint = this.globe.getHorizonPoint(anchor);
      screenPosition = this.globe.projection(horizonPoint);
    }

    return {
      top: screenPosition[1],
      left: screenPosition[0]
    };;
  }

  getQuestion(i) {
    return this.questions[i];
  }

  updateOverlay(question, round, score) {
    if(question)
      this.gameInfoBar.setQuestion(question);
    if(round)
      this.gameInfoBar.setRound(round + '/' + this.maxRound);
    if(score !== null)
      this.gameInfoBar.setScore(score.toString());
  }

  generateQuestions(numQuestions) {
    return this.geoData.getRandomCountries(numQuestions);
  }
}

GeoGame.NUM_QUESTIONS_PER_GAME = 5;
GeoGame.SCORE_PER_QUESTION = 100;
GeoGame.ROTATE_TO_CORRECT_COUNTRY_DELAY = 1500;

GeoGame.FPS_UPDATE_INTERVAL = 500;

module.exports = GeoGame;