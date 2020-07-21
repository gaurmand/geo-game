class EndOverlay {
  constructor(globe, questionResult, overlay, playCb, menuCb) {
    this.globe = globe;
    this.questionResult = questionResult;
    this.playCb = playCb;
    this.menuCb = menuCb;
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
      .on('click', () => this.play());

    this.menuButton = this.buttons.append('button')
      .classed('geo-button menu', true)
      .text('Main Menu')
      .on('click', () => this.menu());
  }

  setQuestionResults(questions) {
    this.clearResults();
    this.questions = questions;

    questions.forEach((question, i) => {
      let questionText = `Q${i+1}: ${question.getCountryName()}`;
      let scoreText = `+${question.getTotalScore()}/${EndOverlay.MAX_QUESTION_SCORE}`;
      let cb = () => {
        this.questionResult.hide();
        this.questionResult.setInfo(question);

        this.viewQuestion(question, () => {
          this.questionResult.show();
        });
      };
    
      this.appendRow(questionText, scoreText, cb);
    });

    this.score.text(`+${questions.getTotalScore()}/${EndOverlay.MAX_QUESTION_SCORE*questions.getNumQuestions()}`)
  }

  appendRow(questionText, scoreText, cb) {
    let row = this.tableBody.append('div')
      .classed('end-table-row', true)

    row.append('div').classed('question', true).text(questionText);
    row.append('div').classed('score', true).text(scoreText);
    row.on('click', cb);
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

  play() {
    this.globe.clearHighlightedCountries();
    this.questionResult.hide();
    this.globe.draw();

    if(this.playCb)
      this.playCb();
  }

  menu() {
    this.globe.clearHighlightedCountries();
    this.questionResult.hide();
    this.globe.draw();

    if(this.menuCb)
      this.menuCb();
  }

  hide() {
    this.endContainer.style('display', 'none');
  }

  node() {
    return this.endContainer.node();
  }

  viewQuestion(question, cb) {
    this.globe.clearHighlightedCountries();
    this.globe.highlightCountry(question.getQuestionCountry(), 'green');
    if(!question.isCorrect())
      this.globe.highlightCountry(question.getAnswerCountry(), 'red');

    this.globe.rotateToLocation(question.getCentroid(), cb);
  }
}

EndOverlay.MAX_QUESTION_SCORE = 120;

module.exports = EndOverlay;