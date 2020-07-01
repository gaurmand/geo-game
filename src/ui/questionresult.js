const d3 = require("d3");

class QuestionResult {
  constructor() {
    this.containerNode = d3.create('div')
      .classed('geo-container result-container', true)
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
      .text(QuestionResult.PROXIMITY_LABEL_TEXT);

    this.scoreLabels.append('div')
      .classed('label', true)
      .text(QuestionResult.ADJACENCY_LABEL_TEXT);

    this.scoreValues = this.scoreBreakdown.append('div')
      .classed('values', true);

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
      .text(QuestionResult.NEXT_BUTTON_TEXT);
  }

  setInfo(title, results) {
    this.title.text(title);
    this.proximity.text('+' + results.proximity);
    this.adjacency.text('+' + results.adjacency);
    this.total.text('+' + results.total);
  }

  setPosition(position) {
    this.containerNode.style('top', position.top + 'px')
      .style('left', position.left + 'px')
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

QuestionResult.PROXIMITY_LABEL_TEXT = 'Proximity:';
QuestionResult.ADJACENCY_LABEL_TEXT = 'Adjacency:';
QuestionResult.TOTAL_LABEL_TEXT = 'Total:';

QuestionResult.NEXT_BUTTON_TEXT = 'Next';

module.exports = QuestionResult;