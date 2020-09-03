class StartOverlay {
  constructor(overlay, startCb) {
    this.overlay = overlay;

    //start screen
    this.startContainer = this.overlay.append('div')
      .classed('start-container fade', true)
      .style('opacity', '0')
      .style('visibility', 'hidden');

    this.title = this.startContainer.append('div')
      .classed('title', true)
      .text(StartOverlay.TITLE_TEXT)

    this.startNode = this.startContainer.append('div')
      .classed('start', true)

    this.startNode.append('button')
      .text(StartOverlay.START_BUTTON_TEXT )
      .classed('start-game start-button', true)
      .on('mouseup', startCb)

    this.startNode.append('button')
      .text(StartOverlay.SETUP_BUTTON_TEXT)
      .classed('set-up-game start-button', true)

    this.startNode.append('button')
      .text(StartOverlay.OPTIONS_BUTTON_TEXT)
      .classed('options start-button', true)

    this.startNode.append('button')
      .text(StartOverlay.ABOUT_BUTTON_TEXT)
      .classed('about start-button', true)
  }

  show() {
    this.startContainer.style('opacity', '1');
    this.startContainer.style('visibility', 'visible');
  }

  hide() {
    this.startContainer.style('opacity', '0');
    this.startContainer.style('visibility', 'hidden');
  }

  node() {
    return this.startContainer.node();
  }
}

StartOverlay.TITLE_TEXT = 'Very Cool Geography Game';
StartOverlay.START_BUTTON_TEXT = 'Start Game';
StartOverlay.SETUP_BUTTON_TEXT = 'Set Up Game';
StartOverlay.OPTIONS_BUTTON_TEXT = 'Options';
StartOverlay.ABOUT_BUTTON_TEXT = 'About';

module.exports = StartOverlay;
