class About {
  constructor(overlay, backCb) {
    this.overlay = overlay;

    this.containerNode = this.overlay.append('div')
      .classed('geo-container about-container fade', true)
      .style('opacity', '0')
      .style('visibility', 'hidden');

    this.about = this.containerNode.append('div')
      .classed('about', true)

    this.what = this.about.append('div')
      .classed('what about-section', true)
      .html(
        `<p class="question">
          What is this?
        </p>
        <p class="answer">
          It's a very cool geography game.
        </p>`
      );

    this.howToPlay = this.about.append('div')
      .classed('how-to-pay about-section', true)
      .html(
        `<p class="question">
          How do I play?
        </p>
        <p class="answer">
          Locate and click the country you are asked to find to earn points. Click and drag to rotate the globe, use the scroll wheel to zoom in.
        </p>`
      );

    this.who = this.about.append('div')
      .classed('who about-section', true)
      .html(
        `<p class="question">
          Who made this?
        </p>
        <p class="answer">
          <a target="_blank" href="https://github.com/gaurmand">Me</a>.
        </p>`
      );

    this.how = this.about.append('div')
      .classed('how about-section', true)
      .html(
        `<p class="question">
          How did you make this?
        </p>
        <p class="answer">
        I made this with vanilla JS, HTML, CSS, Webpack for bundling, D3 for rendering the map, geograhpic data from <a target="_blank" href="https://www.naturalearthdata.com/">Natural Earth</a>. <a target="_blank" href="https://github.com/gaurmand/geo-game">Source</a>.
        </p>`
      );

    this.why = this.about.append('div')
      .classed('why about-section', true)
      .html(
        `<p class="question">
          Why did you make this?
        </p>
        <p class="answer">
          For fun. Also there is a disturbing lack of geography games out there.
        </p>`
      );

    this.upcoming = this.about.append('div')
      .classed('upcoming about-section', true)
      .html(
        `<p class="question">
          Planned features
        </p>
        <ul class="answer">
          <li>Adjacent country scoring</li>
          <li>Difficulty</li>
          <li>Set up game menu - for choosing number of rounds/difficulty</li>
          <li>City guessing mode</li>
          <li>Map style options</li>
          <li>Seeds</li>
          <li>Map projection option</li>
        </ul>`
      );

    this.backButton = this.about.append('div')
      .classed('back-button-container', true)
      .append('button')
      .text('Back')
      .classed('back-button geo-button', true)
      .on('mouseup', backCb)
  }

  show() {
    this.containerNode.style('opacity', '1');
    this.containerNode.style('visibility', 'visible');
  }

  hide() {
    this.containerNode.style('opacity', '0');
    this.containerNode.style('visibility', 'hidden');
  }

  node() {
    return this.containerNode.node();
  }
}

module.exports = About;