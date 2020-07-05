const d3 = require("d3");
const GeoGlobe = require('./globe/geoglobe'); 

const StartOverlay = require('./ui/startoverlay');
const GameInfoBar = require('./ui/gameinfobar');
const FPSCounter = require('./ui/fpscounter');
const QuestionResult = require('./ui/questionresult');
const EndOverlay = require("./ui/endoverlay");

class Question {
  constructor(country) {
    this.questionCountry = country;
    this.centroid = d3.geoCentroid(this.questionCountry);

    this.answered = false;
    this.answerCountry = null;
    this.answerLonLat = null;

    this.correctCountry = false;
    this.adjacentCountry = false;
    this.proximityScore = 0;
    this.adjacencyScore = 0;
    this.totalScore = 0;
  }

  answer(answerLonLat, answerCountry) {
    this.answered = true;
    this.answerCountry = answerCountry;
    this.answerLonLat = answerLonLat;

    return this.computeScore(this.answerCountry, this.questionCountry);
  }

  computeScore(answerCountry, questionCountry){
    if(answerCountry.properties.ISO_A3 == questionCountry.properties.ISO_A3) {
      //correct country clicked
      this.correctCountry = true;
      this.proximityScore = 0;
      this.adjacencyScore = 0;
      this.totalScore = Question.SCORE_PER_QUESTION;
    }

    return this.getScore();
  }

  getScore() {
    return {
      proximity: this.proximityScore,
      adjacency: this.adjacencyScore,
      total: this.totalScore
    };
  }

  getTotalScore() {
    return this.totalScore;
  }

  getCountryName() {
    return this.questionCountry.properties.NAME;
  }

  getCountryId() {
    return this.questionCountry.properties.ISO_A3;
  }

  getAnswerCountryId() {
    return this.answerCountry.properties.ISO_A3;
  }

  getCentroid() {
    return this.centroid;
  }

  isAnswered() {
    return this.answered;
  }

  isCorrect() {
    return this.correctCountry;
  }
}
Question.SCORE_PER_QUESTION = 100;

class QuestionSet {
  constructor(geoData, numQuestions = QuestionSet.DEFAULT_NUM_QUESTIONS) {
    this.numQuestions = numQuestions;
    this.geoData = geoData;
    this.questionCountries = this.geoData.getRandomCountries(numQuestions);
    this.questions = [];
    this.questionCountries.forEach(country => {
      this.questions.push(new Question(country));
    });
  }

  getQuestion(i) {
    return this.questions[i];
  }

  isAnswered() {
    this.questions.forEach(question => {
      if(!question.isAnswered())
        return false;
    });
    return true;
  }

  getTotalScore() {
    let total = 0;
    this.questions.forEach(question => total += question.totalScore);
    return total;
  }

  forEach(cb) {
    this.questions.forEach((question, i, arr) => cb(question, i, arr));
  }
}
QuestionSet.DEFAULT_NUM_QUESTIONS = 10;

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

    this.questionResult = new QuestionResult(this.globe);
    this.endOverlay = new EndOverlay(this.globe, this.questionResult, this.overlay, () => {
      //play again
      this.endOverlay.hide();
      this.gameInfoBar.show();
      this.startGame();
    }, () => {
      //show start overlay
      this.globe.moveToStartPosition();
      this.globe.zoomOut(() => {
        this.globe.disableInteraction();
        this.endOverlay.hide();
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
    this.questions = new QuestionSet(this.geoData, numQuestions);
    this.numQuestions = numQuestions;
    this.currQuestion = 0;
    this.score = 0;

    this.startRound();
  }

  endGame() {
    this.globe.onclick = null;
    this.updateOverlay('GG', null, null);

    this.gameInfoBar.hide();
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

    this.globe.on('click', (lonlat, country) => {
      this.globe.on('click', null);
      this.globe.disableHighlightMode();

      let questionScore = question.answer(lonlat, country);

      this.globe.highlightCountry(question.getCountryId(), 'green');

      if(question.isCorrect()) {
        //correct country clicked
        this.score += questionScore.total;
        this.updateOverlay(null, null, this.score);
      } else 
        //wrong country clicked
        this.globe.highlightCountry(country.properties.ISO_A3, 'red');

      this.globe.draw(); //country highlighting transitions play

      //after transitions finish, rotate globe to show correct country
      setTimeout(() => {
        this.globe.rotateToLocation(question.getCentroid(), () => {
          //show results dialog after rotating
          this.questionResult.setInfo(question, () => {
            //start next round/end game
            this.globe.clearHighlightedCountries();
            this.globe.draw();
            this.questionResult.hide();
            
            if(++this.currQuestion < this.numQuestions)
              //still more rounds to go
              this.startRound();
            else
              //last round finished
              this.endGame();
          });
          this.questionResult.show();
        });
      }, GeoGame.RESULTS_ROTATE_DELAY);

    });
  }

  updateOverlay(question, round, score) {
    if(question)
      this.gameInfoBar.setQuestion(question);
    if(round)
      this.gameInfoBar.setRound(round + '/' + this.numQuestions);
    if(score !== null)
      this.gameInfoBar.setScore(score.toString());
  }

  generateQuestions(numQuestions) {
    return this.geoData.getRandomCountries(numQuestions);
  }
}

GeoGame.NUM_QUESTIONS_PER_GAME = 3;
GeoGame.RESULTS_ROTATE_DELAY = 300;

GeoGame.FPS_UPDATE_INTERVAL = 500;

module.exports = GeoGame;