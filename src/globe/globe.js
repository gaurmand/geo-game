const d3 = require("d3");
const GeoData = require('../geodata');

class Globe {
  constructor(width, height, padding) {
    //create map container div
    this.padding = padding;
    this.width = width;
    this.height = height;

    this.container = d3.create('div')
      .classed('map-container', true);

    this.container
      .style('width', this.width + 'px')
      .style('height', this.height + 'px')
      .style('background', Globe.DEFAULT_COLOUR.BACKGROUND);

    //create map svg
    this.svg = this.container.append('svg')
      .style('transition', 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)')
      .attr('viewBox', `0,0,${this.width},${this.height}`)

    this.map = this.svg.append('g')
      .classed('map', true);

    this.map.append('g')
      .classed('graticule', true)
      .attr('stroke', Globe.DEFAULT_COLOUR.GRATICULE)
      .attr('fill-opacity', '0')
      .attr('stroke-dasharray', Globe.GRATICULE_STROKE_DASHARRAY)
      .attr('stroke-width', Globe.GRATICULE_STROKE_WIDTH)
      .append('path');

    this.map.append('g')
      .classed('countries', true)
      .attr('fill', Globe.DEFAULT_COLOUR.COUNTRY_FILL)
      .attr('stroke', Globe.DEFAULT_COLOUR.COUNTRY_STROKE)
      .attr('stroke-width', Globe.COUNTRY_STOKE_WIDTH);

    this.map.append('g')
      .classed('lakes', true)
      .attr('fill', Globe.DEFAULT_COLOUR.LAKE);

    this.map.append('g')
      .classed('rivers', true)
      .attr('fill-opacity', '0')
      .attr('stroke', Globe.DEFAULT_COLOUR.RIVER)
      .attr('stroke-dasharray', Globe.RIVER_STROKE_DASHARRAY)
      .attr('stroke-width', Globe.RIVER_STROKE_WIDTH)
      .attr('pointer-events', 'none');

    //create graticule
    this.graticule = d3.geoGraticule();

    //initial projection and path generator
    let left = this.padding.left;
    let right = this.width - this.padding.right;
    let top = this.padding.top;
    let bottom = this.height - this.padding.bottom;

    this.projection = d3.geoOrthographic()
      .fitExtent([
        [left, top],
        [right, bottom]
      ], GeoData.COUNTRIES_110M)

    this.geoGenerator = d3.geoPath()
      .projection(this.projection)

    //stats
    this.drawTime = 0;
    this.numDraws = 0;
    this.drawStart = 0;
  }

  //generate and draw map and graticule paths
  draw() {
    this.startDrawTimer();

    let data = this.getData();
    this.drawCountries(data.countries);
    this.drawGraticule();
    this.drawRivers(data.rivers);
    this.drawLakes(data.lakes);

    this.endDrawTimer();
  }

  drawCountries(countries) {
    this.map.select('g.countries')
      .selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('d', this.geoGenerator);
  }

  drawGraticule() {
    this.map.select('g.graticule path')
      .attr('d', this.geoGenerator(this.graticule()));
  }

  drawRivers(rivers) {
    this.map.select('g.rivers')
      .selectAll('path')
      .data(rivers.features)
      .join('path')
      .attr('d', this.geoGenerator);
  }

  drawLakes(lakes) {
    this.map.select('g.lakes')
      .selectAll('path')
      .data(lakes.features)
      .join('path')
      .attr('d', this.geoGenerator);
  }

  startDrawTimer() {
    this.drawStart = Date.now();
  }

  endDrawTimer() {
    let delta = Date.now() - this.drawStart;
    this.drawTime += delta;
    this.numDraws++;
    let avgDrawTime = this.drawTime / this.numDraws;

    if (Globe.DEBUG) {
      console.log('draw time: ' + delta);
      console.log('avg draw time: ' + avgDrawTime);
    }
  }

  clearStats() {
    this.drawTime = 0;
    this.numDraws = 0;
  }

  //get map container node
  node() {
    return this.container.node();
  }

  getData() {
    return {
      countries: GeoData.COUNTRIES_110M,  
      rivers: GeoData.RIVERS_110M, 
      lakes: GeoData.LAKES_110M
    };
  }

  getMapBBox() {
    return this.map.node().getBBox();
  }

  transform(tx, ty, s = 1) {
    this.svg.attr('transform', `translate(${tx}, ${ty}) scale(${s})`);
  }
}

//MAP CONSANTS
Globe.DEBUG = false;

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

module.exports = Globe;