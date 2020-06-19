const {
  Globe
} = require('./globe');

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
      .text('Round: ')
      .classed('label', true);

    this.round = this.overlayNode.select('.round-container').append('div')
      .classed('round', true);

    this.overlayNode.select('.info-container').append('div')
      .classed('info question-container', true);

    this.overlayNode.select('.question-container').append('div')
      .text('Where in the goddamn fuck is: ')
      .classed('label', true);

    this.question = this.overlayNode.select('.question-container').append('div')
      .classed('question', true);

    this.overlayNode.select('.info-container').append('div')
      .classed('info score-container', true);

    this.overlayNode.select('.score-container').append('div')
      .text('Score: ')
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
    this.globe = new Globe(window.innerWidth, window.innerHeight);
    this.geoData = geoData;
    this.overlay = new Overlay();
  }

  append() {
    document.body.appendChild(this.globe.node());
    document.body.appendChild(this.overlay.node());

    this.overlay.setQuestion('Sri Lanka');
    this.overlay.setRound('1/5')
    this.overlay.setScore('0')

  }

  startGame() {

  }

  generateQuestions() {

  }
}

module.exports = {
  GeoGame
};