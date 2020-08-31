class GameInfoBar {
  constructor(overlay) {
    this.overlay = overlay;

    this.infoBar = this.overlay.append('div')
      .classed('info-bar', true)
      .style('display', 'none')

    this.infoContainer = this.infoBar.append('div')
      .classed('info-container', true);

    //round info
    this.infoContainer.append('div')
      .classed('info round-container', true);

    this.infoContainer.select('.round-container').append('div')
      .text(GameInfoBar.ROUND_LABEL_TEXT)
      .classed('label', true);

    this.round = this.infoContainer.select('.round-container').append('div')
      .classed('round', true);

    //question info
    this.infoContainer.append('div')
      .classed('info question-container', true);

    this.infoContainer.select('.question-container').append('div')
      .text(GameInfoBar.QUESTION_PROMPT)
      .classed('label', true);

    this.question = this.infoContainer.select('.question-container').append('div')
      .classed('question', true);

    //score info
    this.infoContainer.append('div')
      .classed('info score-container', true);

    this.infoContainer.select('.score-container').append('div')
      .text(GameInfoBar.SCORE_LABEL_TEXT)
      .classed('label', true);

    this.score = this.infoContainer.select('.score-container').append('div')
      .classed('score', true);
  }

  show() {
    this.infoBar.style('display', 'flex');
  }

  hide() {
    this.infoBar.style('display', 'none');
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
    return this.infoBar.node();
  }
}

GameInfoBar.QUESTION_PROMPT = 'Where in the world is: ';
GameInfoBar.SCORE_LABEL_TEXT = 'Score: ';
GameInfoBar.ROUND_LABEL_TEXT = 'Round: ';

module.exports = GameInfoBar;