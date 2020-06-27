const {
  ModifiableGlobe
} = require('./modifiableglobe');

const d3 = require("d3");

class Overlay {
  constructor(startCb) {
    this.overlayNode = d3.create('div')
      .classed('overlay', true);

    this.infoBar = this.overlayNode.append('div')
      .classed('info-bar', true)
      .classed('hidden', true)

    this.infoBar.append('div')
      .classed('info-container', true);

    this.overlayNode.select('.info-container').append('div')
      .classed('info round-container', true);

    this.overlayNode.select('.round-container').append('div')
      .text(GeoGame.ROUND_LABEL)
      .classed('label', true);

    //top bar
    this.round = this.overlayNode.select('.round-container').append('div')
      .classed('round', true);

    this.overlayNode.select('.info-container').append('div')
      .classed('info question-container', true);

    this.overlayNode.select('.question-container').append('div')
      .text(GeoGame.QUESTION_PROMPT)
      .classed('label', true);

    this.question = this.overlayNode.select('.question-container').append('div')
      .classed('question', true);

    this.overlayNode.select('.info-container').append('div')
      .classed('info score-container', true);

    this.overlayNode.select('.score-container').append('div')
      .text(GeoGame.SCORE_LABEL)
      .classed('label', true);

    this.score = this.overlayNode.select('.score-container').append('div')
      .classed('score', true);

    //start screen
    this.startContainer = this.overlayNode.append('div')
      .classed('start-container', true)

    this.title = this.startContainer.append('div')
      .classed('title', true)
      .text('Very Cool Geography Game')

    this.startNode = this.startContainer.append('div')
      .classed('start', true)

    this.startNode.append('button')
      .text('Start Game')
      .classed('start-game start-button', true)
      .on('mouseup', startCb)

    this.startNode.append('button')
      .text('Set Up Game')
      .classed('set-up-game start-button', true)

    this.startNode.append('button')
      .text('Options')
      .classed('options start-button', true)

    this.startNode.append('button')
      .text('About')
      .classed('about start-button', true)

    //fps counter
    this.fps = this.overlayNode.append('div')
      .classed('fps-counter', true)
  }

  showStartScreen() {
    this.startContainer.classed('hidden', false);
  }

  hideStartScreen() {
    this.startContainer.classed('hidden', true);
  }

  showInfoBar() {
    this.infoBar.classed('hidden', false);
  }

  hideInfoBar() {
    this.infoBar.classed('hidden', true);
  }

  setQuestion(text) {
    this.question.text(text);
  }

  setRound(text) {
    this.round.text(text);
  }

  setScore(text) {
    this.score.text(text);
  }

  setFPS(text) {
    this.fps.text(text);
  }

  node() {
    return this.overlayNode.node();
  }
}

class GeoGame {
  constructor(geoData) {
    this.globe = new ModifiableGlobe(window.innerWidth, window.innerHeight);
    this.globe.draw();

    this.geoData = geoData;
    this.overlay = new Overlay(() => {
      this.globe.enableInteraction();
      this.overlay.hideStartScreen();
      this.overlay.showInfoBar();
      this.startGame();
    });

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
    this.globe.startAutoRotate();
  }

  updateFPSCounter() {
    if(this.globe.numDraws) {
      let fps = 1000 * this.globe.numDraws / GeoGame.FPS_UPDATE_INTERVAL ;
      this.overlay.setFPS(Math.round(fps));
    } else
      this.overlay.setFPS('idle');

    this.globe.clearStats();
  }

  startGame(numQuestions = GeoGame.NUM_QUESTIONS_PER_GAME) {
    this.globe.setHighlightMode();

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
    this.globe.unsetHighlightMode();
  }

  startRound() {
    let question = this.getQuestion(this.questionIndex);
    this.updateOverlay(question.properties.NAME, this.round, this.score);

    this.globe.onclick = (lonlat, country) => {
      if(country.properties.ISO_A3 == question.properties.ISO_A3) {
        this.score += GeoGame.SCORE_PER_QUESTION;
        this.updateOverlay(null, null, this.score);
      }
      
      this.globe.rotateToLocation(question, () => {
        if(this.round < this.maxRound) {
          this.round++;
          this.questionIndex++;
          this.startRound();
        } else
          this.endGame();
      });
    };
  }

  getQuestion(i) {
    return this.questions[i];
  }

  updateOverlay(question, round, score) {
    if(question)
      this.overlay.setQuestion(question);
    if(round)
      this.overlay.setRound(round + '/' + this.maxRound);
    if(score !== null) {
      this.overlay.setScore(score.toString());
    }
  }

  generateQuestions(numQuestions) {
    return this.geoData.getRandomCountries(numQuestions);
  }
}

GeoGame.NUM_QUESTIONS_PER_GAME= 10;
GeoGame.SCORE_PER_QUESTION = 100;
GeoGame.QUESTION_PROMPT = 'Where in the goddamn fuck is: ';
GeoGame.SCORE_LABEL = 'Score: ';
GeoGame.ROUND_LABEL = 'Round: ';

GeoGame.FPS_UPDATE_INTERVAL = 500;

module.exports = {
  GeoGame
};