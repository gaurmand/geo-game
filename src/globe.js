const d3 = require("d3");

class Globe {
  constructor(width, height, geojson) {
    this.geojson = geojson;
    this.width = width;
    this.height = height;

    //create map container div
    this.mapContainer = d3.create('div')
      .classed('map-container', true);

    this.mapContainer
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
      .style('background', Globe.BACKGROUND_COLOUR);

    //create map svg
    this.mapSVG = this.mapContainer.append('svg');

    this.mapSVG.attr('viewBox', `0,0,${this.width},${this.height}`)
      .attr('width', `${this.width}`)
      .attr('height', `${this.height}`);

    this.mapSVG.append('g')
      .classed('map', true);

    this.mapSVG.append('g')
      .classed('graticule', true);

    //create graticule
    this.graticule = d3.geoGraticule();

    this.mapSVG.select('g.graticule')
      .append('path')
      .attr('stroke', Globe.GRATICULE_COLOUR)
      .attr('fill-opacity', '0')
      .attr('stroke-dasharray', Globe.GRATICULE_STROKE_DASHARRAY);

    //initial projection and path generator
    this.projection = d3.geoOrthographic()
      .fitExtent([
        [0, Globe.PADDING_TOP],
        [this.width, this.height - Globe.PADDING_BOTTOM]
      ], this.geojson);

    this.initialScale = this.projection.scale();

    this.geoGenerator = d3.geoPath()
      .projection(this.projection);

    //draw map and this.graticule
    this.draw();

    //zoom & pan interactivity
    this.lastZoom = 0;
    this.lastTransform = {k: 1, x: 0, y: 0};

    this.mapSVG.call(
      d3.zoom()
        .scaleExtent([Globe.MIN_SCALE/this.initialScale, Globe.MAX_SCALE/this.initialScale])
        .on('zoom', () => {
          if(d3.event.sourceEvent instanceof WheelEvent) {
            //interactive scaling

            d3.event.transform.x = this.lastTransform.x;
            d3.event.transform.y = this.lastTransform.y;

            let newScale = this.computeScale(d3.event.transform);
            this.scaleProjection(newScale);
          } else {
            //interactive rotation

            let delta = Date.now() - this.lastZoom
            if (delta < Globe.ROTATION_UPDATE_INTERVAL)
              return;
  
            let rotation = this.computeRotation(d3.event.transform, this.lastTransform);
            this.rotateProjection(rotation);

            this.lastZoom  = Date.now();
            this.lastTransform = d3.event.transform;
          }
        })
    );
  }

  //generate and draw map and graticule paths
  draw() {
    this.mapSVG.select('g.map')
      .selectAll('path')
      .data(this.geojson.features)
      .join('path')
      .attr('d', this.geoGenerator)
      .attr('fill', Globe.MAP_COLOUR)
      .attr('stroke', Globe.MAP_BORDER_COLOUR);

    this.mapSVG.select('g.graticule path')
      .attr('d', this.geoGenerator(this.graticule()));
  }

  //get map container node
  node() {
    return this.mapContainer.node();
  }

  //given a MouseEvent object, return the cursor's screen coordinates
  getCoords(event) {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }

  //given two screen coordinates (of a drag gesture), calculate the new projection rotation
  computeRotation(transform, lastTransform) {
    const rotation = this.projection.rotate();
    const scale = this.projection.scale();
    const rotationFactor = (Globe.ROTATION_SCALE_CONSTANT / scale); //change in rotation should be inversely proportional to scale

    let deltaX = transform.x - lastTransform.x;
    let deltaY = transform.y - lastTransform.y;

    let λ = rotation[0] + deltaX*rotationFactor;
    let φ = rotation[1] + -deltaY*rotationFactor;
    let γ = rotation[2];

    φ = φ > Globe.MAX_LATITUDE ? Globe.MAX_LATITUDE : φ;
    φ = φ < Globe.MIN_LATITUDE ? Globe.MIN_LATITUDE : φ;

    return [λ, φ, γ];
  }

  computeScale(transform) {
    return this.initialScale*transform.k;
  }

  //set projection rotation [lambda, phi, gamma]
  rotateProjection(rotation) {
    this.projection.rotate(rotation);
    this.geoGenerator.projection(this.projection);
    this.draw();
  }

  //set projection scale
  scaleProjection(scale) {
    this.projection.scale(scale);
    this.geoGenerator.projection(this.projection);
    this.draw();
  }
}

Globe.PADDING_TOP = 50;
Globe.PADDING_BOTTOM = Globe.PADDING_TOP;

Globe.BACKGROUND_COLOUR = '#000000';
Globe.MAP_COLOUR = 'aqua';
Globe.MAP_BORDER_COLOUR = 'black';
Globe.GRATICULE_COLOUR = '#333333';
Globe.GRATICULE_STROKE_DASHARRAY = '2';

Globe.MAX_LATITUDE = 90;
Globe.MIN_LATITUDE = -Globe.MAX_LATITUDE;

Globe.ROTATION_UPDATE_INTERVAL = 35;
Globe.ROTATION_SPEED = 250;

Globe.MAX_SCALE = 1500;
Globe.MIN_SCALE = 200;
Globe.SCALE_CHANGE_CONSTANT = 1/6;
Globe.ROTATION_SCALE_CONSTANT = 90;

module.exports = {
  Globe
};