const d3 = require("d3");

const ne_50m_admin_0_countries = require('../data/GeoJSON/ne_50m_admin_0_countries.json');
const ne_110m_admin_0_countries = require('../data/GeoJSON/ne_110m_admin_0_countries.json');

const ne_110m_rivers_lake_centerlines = require('../data/GeoJSON/ne_110m_rivers_lake_centerlines.json');
const ne_50m_rivers_lake_centerlines = require('../data/GeoJSON/ne_50m_rivers_lake_centerlines.json');

const ne_110m_lakes = require('../data/GeoJSON/ne_110m_lakes.json');
const ne_50m_lakes = require('../data/GeoJSON/ne_50m_lakes.json');

class Globe {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    //create map container div
    this.mapContainer = d3.create('div')
      .classed('map-container', true);

    this.mapContainer
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
      .style('background', Globe.DEFAULT_COLOUR.BACKGROUND);

    //create map svg
    this.mapSVG = this.mapContainer.append('svg');

    this.mapSVG.attr('viewBox', `0,0,${this.width},${this.height}`)
      .attr('width', `${this.width}`)
      .attr('height', `${this.height}`);

    this.mapSVG.append('g')
      .classed('graticule', true)
      .attr('stroke', Globe.DEFAULT_COLOUR.GRATICULE)
      .attr('fill-opacity', '0')
      .attr('stroke-dasharray', Globe.GRATICULE_STROKE_DASHARRAY)
      .attr('stroke-width', Globe.GRATICULE_STROKE_WIDTH)
      .append('path');

    this.mapSVG.append('g')
      .classed('countries', true)
      .attr('fill', Globe.DEFAULT_COLOUR.COUNTRY_FILL)
      .attr('stroke', Globe.DEFAULT_COLOUR.COUNTRY_STROKE)
      .attr('stroke-width', Globe.COUNTRY_STOKE_WIDTH);

    this.mapSVG.append('g')
      .classed('lakes', true)
      .attr('fill', Globe.DEFAULT_COLOUR.LAKE);

    this.mapSVG.append('g')
      .classed('rivers', true)
      .attr('fill-opacity', '0')
      .attr('stroke', Globe.DEFAULT_COLOUR.RIVER)
      .attr('stroke-dasharray', Globe.RIVER_STROKE_DASHARRAY)
      .attr('stroke-width', Globe.RIVER_STROKE_WIDTH)
      .attr('pointer-events', 'none');

    //create graticule
    this.graticule = d3.geoGraticule();

    //initial projection and path generator
    this.projection = d3.geoOrthographic()
      .fitExtent([
        [0, Globe.PADDING_TOP],
        [this.width, this.height - Globe.PADDING_BOTTOM]
      ], ne_110m_admin_0_countries)

    this.initialScale = this.projection.scale();

    this.geoGenerator = d3.geoPath()
      .projection(this.projection)

    //draw map and this.graticule
    this.drawTime = 0;
    this.numDraws = 0;
    this.draw();

    //zoom & pan interactivity
    this.lastZoom = 0;
    this.lastTransform = {k: 1, x: 0, y: 0};
    this.isZooming = false;

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
        .on('start', () => {
          this.isZooming = true;
        })
        .on('end', () => {
          this.isZooming = false;
          this.draw();
        })
    );
  }

  //generate and draw map and graticule paths
  draw() {
    let start = Date.now();

    let data = this.getData();

    this.mapSVG.select('g.countries')
      .selectAll('path')
      .data(data.countries.features)
      .join('path')
      .attr('d', this.geoGenerator)
      .on('mousedown', d => {
        console.log(d.properties.NAME);
      });

    this.mapSVG.select('g.lakes')
      .selectAll('path')
      .data(data.lakes.features)
      .join('path')
      .attr('d', this.geoGenerator);

    this.mapSVG.select('g.rivers')
      .selectAll('path')
      .data(data.rivers.features)
      .join('path')
      .attr('d', this.geoGenerator);

    this.mapSVG.select('g.graticule path')
      .attr('d', this.geoGenerator(this.graticule()));

    let delta = Date.now() - start;
    this.drawTime += delta;
    this.numDraws++;
    let avgDrawTime = this.drawTime/this.numDraws;

    if(Globe.debug) {
      console.log('draw time: ' + delta);
      console.log('avg draw time: ' + avgDrawTime);
    }
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

  getData() {
    let countries, rivers, lakes;
    const scale = this.projection.scale();

    if(this.isZooming || scale < 2000) {
      countries = ne_110m_admin_0_countries;
      rivers = ne_110m_rivers_lake_centerlines;
      lakes = ne_110m_lakes;
    } else {
      countries = ne_50m_admin_0_countries;
      rivers = ne_50m_rivers_lake_centerlines;
      lakes = ne_50m_lakes;
    }

    return {countries, rivers, lakes};
  }
}

//MAP CONSANTS
Globe.PADDING_TOP = 50;
Globe.PADDING_BOTTOM = Globe.PADDING_TOP;

Globe.MAX_LATITUDE = 90;
Globe.MIN_LATITUDE = -Globe.MAX_LATITUDE;

Globe.DEBUG = true;

//MAP DEFAULT STYLE
Globe.DEFAULT_COLOUR = {
  COUNTRY_FILL: '#99FFFF',
  COUNTRY_STROKE: '#000000',
  RIVER: '#000000',
  LAKE: '#000000',
  GRATICULE: '#333333',
  BACKGROUND: '#000000'
};

Globe.GRATICULE_STROKE_DASHARRAY = '2';
Globe.GRATICULE_STROKE_WIDTH= '1';

Globe.RIVER_STROKE_DASHARRAY = '2';
Globe.RIVER_STROKE_WIDTH = '0.8';

Globe.COUNTRY_STOKE_WIDTH = '1.1';

//INTERACTION CONSTANTS
Globe.MAX_SCALE = 4000;
Globe.MIN_SCALE = 300;

Globe.ROTATION_UPDATE_INTERVAL = 35;
Globe.ROTATION_SPEED = 250;

Globe.SCALE_CHANGE_CONSTANT = 1/6;
Globe.ROTATION_SCALE_CONSTANT = 90;

module.exports = {
  Globe
};