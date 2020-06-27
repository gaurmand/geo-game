const {
  ModifiableGlobe
} = require('./modifiableglobe');

const d3 = require("d3");

class Overlay {
  constructor() {
    this.overlayNode = d3.create('div')
      .classed('overlay', true);

    this.overlayNode.append('div')
      .classed('info-bar', true)
      .append('div')
      .classed('info-container', true);

    this.overlayNode.select('.info-container').append('div')
      .classed('info round-container', true);

    this.overlayNode.select('.round-container').append('div')
      .text(GeoGame.ROUND_LABEL)
      .classed('label', true);

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

  node() {
    return this.overlayNode.node();
  }
}

class GeoGame {
  constructor(geoData) {
    this.globe = new ModifiableGlobe(window.innerWidth, window.innerHeight);
    this.globe.draw();

    this.geoData = geoData;
    this.overlay = new Overlay();

    this.questions = [];
    this.questionIndex = 0;
    this.round = 0;
    this.score = 0;
    this.maxRound = 0;
  }

  append() {
    document.body.appendChild(this.globe.node());
    document.body.appendChild(this.overlay.node());
    this.globe.startAutoRotate();
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
    this.updateOverlay(question.NAME, this.round, this.score);

    this.globe.onclick = (country) => {
      if(country.ISO_A3 == question.ISO_A3)
        this.score += GeoGame.SCORE_PER_QUESTION;
      
        this.updateOverlay(null, null, this.score);
        if(this.round < this.maxRound) {
          this.round++;
          this.questionIndex++;
          this.startRound();
        } else
          this.endGame();
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

module.exports = {
  GeoGame
};