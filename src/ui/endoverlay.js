class EndOverlay {
  constructor(overlay, playCb, menuCb) {
    this.overlay = overlay;
    this.questions = [];

    this.endContainer = this.overlay.append('div')
      .classed('geo-container end-container', true)
      .style('display', 'none');

    this.end = this.endContainer.append('div')
      .classed('end', true);

    this.title = this.end.append('div')
      .classed('title', true)

    this.title.append('div')
      .classed('label', true)
      .text('Final Score:')

    this.score = this.title.append('div')
    .classed('score', true)

    //table
    this.table = this.end.append('div')
      .classed('end-table', true);

    this.tableHead = this.table.append('div')
      .classed('end-table-head', true)
    
    this.tableHead.append('div')
      .classed('question label', true)
      .text('Question')

    this.tableHead.append('div')
      .classed('score label', true)
      .text('Score')

    this.tableBody = this.table.append('div')
      .classed('end-table-body', true)

    //buttons
    this.buttons = this.end.append('div')
      .classed('buttons', true);

    this.playButton = this.buttons.append('button')
      .classed('geo-button play', true)
      .text('Play Again')
      .on('click', playCb);

    this.menuButton = this.buttons.append('button')
      .classed('geo-button menu', true)
      .text('Main Menu')
      .on('click', menuCb);
  }

  setQuestionResults(questions) {
    this.clearResults();
    this.questions = questions;

    questions.forEach((question, i) => {
      let questionText = `Q${i+1}: ${question.getCountryName()}`;
      let scoreText = `+${question.getTotalScore()}`;
      this.appendRow(questionText, scoreText);
    });

    this.score.text(`+${questions.getTotalScore()}`)
  }

  appendRow(questionText, scoreText) {
    let row = this.tableBody.append('div')
      .classed('end-table-row', true)

    row.append('div').classed('question', true).text(questionText);
    row.append('div').classed('score', true).text(scoreText);
  }

  clearResults() {
    this.tableBody.selectAll('.end-table-row').remove();
    this.questions = [];
  }

  setPosition(map) {
    // console.log(map)
    let globeWidth = Math.round(map.width);
    let windowWidth = window.innerWidth;
    let left = windowWidth/2 + globeWidth/2 + 30;
    this.endContainer.style('left', `${left}px`);

  }

  show() {
    this.endContainer.style('display', 'block');
  }

  hide() {
    this.endContainer.style('display', 'none');
  }

  node() {
    return this.endContainer.node();
  }
}

module.exports = EndOverlay;