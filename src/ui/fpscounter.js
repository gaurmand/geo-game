class FPSCounter {
  constructor(overlay) {
    this.overlay = overlay;

    this.fps = this.overlay.append('div')
      .classed('fps-counter', true)
  }

  setFPS(text) {
    this.fps.text(text);
  }

  node() {
    return this.fps.node();
  }
}

module.exports = FPSCounter;