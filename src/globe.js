const d3 = require("d3");

// const ne_10m_land = require('../data/GeoJSON/ne_10m_land.json');
// const ne_50m_land = require('../data/GeoJSON/ne_50m_land.json');
const ne_110m_land = require('../data/GeoJSON/ne_110m_land.json');
// const ne_110m_admin = require('../data/GeoJSON/ne_110m_admin_0_countries.json');

class Globe {
  constructor(width, height) {
    this.geojson = Globe.GEOJSON;
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

    this.geoGenerator = d3.geoPath()
      .projection(this.projection);

    //draw map and this.graticule
    this.draw();

    //interactive rotation
    this.lastMouseCoords = null;
    this.mapContainer.node().onmousedown = (event) => {
      this.lastMouseCoords = this.getCoords(event);
    };

    this.lastMouseMove = 0;
    this.mapContainer.node().onmousemove = (event) => {
      const mouseMoveDelta = Date.now() - this.lastMouseMove;
      const isMouseDown = event.buttons == 1;

      if (mouseMoveDelta > Globe.ROTATION_UPDATE_INTERVAL && isMouseDown) {
        let coords1 = this.lastMouseCoords;
        let coords2 = this.getCoords(event);
        let newRotation = this.computeRotation(coords1, coords2)
        this.rotateProjection(newRotation);

        this.lastMouseMove = Date.now();
        this.lastMouseCoords = coords2;
      }
    }

    //interactive scaling
    this.mapContainer.node().onwheel = (event) => {
      const currScale = this.projection.scale();
      const scaleChange = currScale*Globe.SCALE_CHANGE_CONSTANT; //scale change should be propertional to the current scale
    
      let newScale = currScale;
      if(event.deltaY < 0)
        newScale += scaleChange; //zoom in
      else
        newScale -= scaleChange; //zoom out

      newScale = newScale > Globe.MAX_SCALE ? Globe.MAX_SCALE : newScale;
      newScale = newScale < Globe.MIN_SCALE ? Globe.MIN_SCALE : newScale;

      this.scaleProjection(newScale);
    }
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
  computeRotation(coords1, coords2) {
    const rotation = this.projection.rotate();
    const scale = this.projection.scale()

    const rotationXFactor = (Globe.ROTATION_SCALE_CONSTANT / scale) * (Globe.ROTATION_SPEED / this.width); //change in rotation should be inversely proportional to scale
    const rotationYFactor = (Globe.ROTATION_SCALE_CONSTANT / scale) * (Globe.ROTATION_SPEED / this.height);

    let newRotation = [rotation[0] + rotationXFactor * (coords2.x - coords1.x), rotation[1] + rotationYFactor * (coords1.y - coords2.y), rotation[2]];

    //limit phi angle (prevents earth from going upside down)
    if (newRotation[1] > Globe.MAX_LATITUDE)
      newRotation[1] = Globe.MAX_LATITUDE;
    else if (newRotation[1] < Globe.MIN_LATITUDE)
      newRotation[1] = Globe.MIN_LATITUDE;

    return newRotation;

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

Globe.GEOJSON = ne_110m_land;

Globe.PADDING_TOP = 50;
Globe.PADDING_BOTTOM = Globe.PADDING_TOP;

Globe.BACKGROUND_COLOUR = '#000000';
Globe.MAP_COLOUR = 'aqua';
Globe.MAP_BORDER_COLOUR = 'black';
Globe.GRATICULE_COLOUR = '#333333';
Globe.GRATICULE_STROKE_DASHARRAY = '2';

Globe.MAX_LATITUDE = 90;
Globe.MIN_LATITUDE = -Globe.MAX_LATITUDE;

Globe.ROTATION_UPDATE_INTERVAL = 40;
Globe.ROTATION_SPEED = 250;

Globe.MAX_SCALE = 1500;
Globe.MIN_SCALE = 200;
Globe.SCALE_CHANGE_CONSTANT = 1/6;
Globe.ROTATION_SCALE_CONSTANT = 350;

module.exports = {
  Globe
};