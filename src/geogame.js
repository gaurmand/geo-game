const {
  ModifiableGlobe
} = require('./modifiableglobe');

const d3 = require("d3");

class QuestionResult {
  constructor() {
    this.containerNode = d3.create('div')
      .classed('geo-container result-container', true)
      .style('visibility', 'hidden')
      .style('top', '0px')

    this.result = this.containerNode.append('div')
      .classed('result', true);
    
    this.title = this.result.append('div')
      .classed('title', true)
      .text('Bosnia & Herzegovina')

    this.scoreBreakdown = this.result.append('div')
      .classed('breakdown', true)

    this.scoreLabels = this.scoreBreakdown.append('div')
      .classed('labels', true)

    this.scoreLabels.append('div')
      .classed('label', true)
      .text('Proximity:')

    this.scoreLabels.append('div')
      .classed('label', true)
      .text('Adjacency:')

    this.scoreValues = this.scoreBreakdown.append('div')
      .classed('values', true)

    this.proximity = this.scoreValues.append('div')
      .classed('value', true)
      .text('+1400')

    this.adjacency = this.scoreValues.append('div')
      .classed('value', true)
      .text('+100')

    this.result.append('div')
      .classed('divider', true)

    this.totalContainer = this.result.append('div')
      .classed('total', true)

    this.totalContainer.append('div')
      .classed('label', true)
      .text('Total: ')

    this.total = this.totalContainer.append('div')
      .classed('value', true)
      .text('+1500')

    this.nextButton = this.result.append('button')
      .classed('geo-button next', true)
      .text('Next')
  }

  setInfo(title, results) {
    this.title.text(title);
    this.proximity.text('+'+results.proximity);
    this.adjacency.text('+'+results.adjacency);
    this.total.text('+'+results.total);

  }

  setPosition(position) {
    this.containerNode.style('top', position.top+'px')
      .style('left', position.left+'px')
  }

  onNext(next) {
    this.nextButton.on('mouseup', next);
  }

  show() {
    this.containerNode.style('visibility', 'visible');
  }

  hide() {
    this.containerNode.style('visibility', 'hidden');
  }

  node() {
    return this.containerNode.node();
  }
}

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

    this.questionResult = new QuestionResult();

    setInterval(() => {
      this.updateFPSCounter();
    }, GeoGame.FPS_UPDATE_INTERVAL);
  }

  append() {
    document.body.appendChild(this.globe.node());
    document.body.appendChild(this.overlay.node());
    document.body.appendChild(this.questionResult.node());

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
GeoGame.ROTATE_TO_CORRECT_COUNTRY_DELAY = 1500;

GeoGame.FPS_UPDATE_INTERVAL = 500;

module.exports = {
  GeoGame
};