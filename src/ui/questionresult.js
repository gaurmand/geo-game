const d3 = require("d3");

class QuestionResult {
  constructor(globe, question, cb) {
    this.globe = globe;
    this.question = question;

    this.containerNode = d3.create('div')
      .classed('geo-container result-container fade', true)
      .style('visibility', 'hidden')
      .style('top', '0px');

    this.result = this.containerNode.append('div')
      .classed('result', true);

    this.title = this.result.append('div')
      .classed('title', true);

    this.scoreBreakdown = this.result.append('div')
      .classed('breakdown', true);

    this.scoreLabels = this.scoreBreakdown.append('div')
      .classed('labels', true);

    this.scoreLabels.append('div')
      .classed('label', true)
      .text(QuestionResult.ACCURACY_LABEL_TEXT);

    this.scoreLabels.append('div')
      .classed('label', true)
      .text(QuestionResult.PROXIMITY_LABEL_TEXT);

    this.scoreLabels.append('div')
      .classed('label', true)
      .text(QuestionResult.ADJACENCY_LABEL_TEXT);

    this.scoreValues = this.scoreBreakdown.append('div')
      .classed('values', true);

    this.accuracy = this.scoreValues.append('div')
      .classed('value', true);

    this.proximity = this.scoreValues.append('div')
      .classed('value', true);

    this.adjacency = this.scoreValues.append('div')
      .classed('value', true);

    this.result.append('div')
      .classed('divider', true);

    this.totalContainer = this.result.append('div')
      .classed('total', true);

    this.totalContainer.append('div')
      .classed('label', true)
      .text(QuestionResult.TOTAL_LABEL_TEXT);

    this.total = this.totalContainer.append('div')
      .classed('value', true);

    this.nextButton = this.result.append('button')
      .classed('geo-button next', true)
      .text(QuestionResult.NEXT_BUTTON_TEXT)
      .on('mouseup', () => this.next());

    //set info
    this.title.text(question.getCountryName());

    let score = question.getScore();
    this.accuracy.text('+' + score.accuracy);
    this.proximity.text('+' + score.proximity);
    this.adjacency.text('+' + score.adjacency);
    this.total.text(`+${score.total}/${QuestionResult.MAX_SCORE}`);

    this.anchor = question.getCentroid();
    this.nextCb = cb;

    document.body.appendChild(this.containerNode.node());
  }

  setInitialPosition() {
    this.globe.on('draw', () => {
      //update results positions when globe is redrawn
      let screenPosition = this.getPosition(this.anchor);
      this.setPosition(screenPosition);
    });
    this.globe.draw();
  }

  setPosition(position) {
    this.containerNode.style('top', position.top + 'px')
      .style('left', position.left + 'px')
  }

  getPosition(anchor) {
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

  onNext(next) {
    this.nextButton.on('mouseup', next);
  }

  next() {
    if (this.nextCb)
      this.nextCb();
  }

  show() {
    if(!this.nextCb)
      this.nextButton.style('display', 'none');
    else
      this.nextButton.style('display', 'inline');

    this.containerNode.style('opacity', '1');
    this.containerNode.style('visibility', 'visible');
  }

  hide(remove = true) {
    this.globe.on('draw', null); //stop updating pos
    this.containerNode.style('opacity', '0');
    this.containerNode.style('visibility', 'hidden');
  }

  remove() {
    setTimeout(() => {
      this.containerNode.node().remove();
    }, 1000);
  }

  node() {
    return this.containerNode.node();
  }
}

QuestionResult.PROXIMITY_LABEL_TEXT = 'Proximity:';
QuestionResult.ADJACENCY_LABEL_TEXT = 'Adjacency:';
QuestionResult.ACCURACY_LABEL_TEXT = 'Accuracy:';
QuestionResult.TOTAL_LABEL_TEXT = 'Total:';

QuestionResult.NEXT_BUTTON_TEXT = 'Next';

QuestionResult.MAX_SCORE = 120;

module.exports = QuestionResult;