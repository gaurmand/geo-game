const d3 = require("d3");

// const ne_10m_land = require('../data/GeoJSON/ne_10m_land.json');
// const ne_50m_land = require('../data/GeoJSON/ne_50m_land.json');
const ne_110m_land = require('../data/GeoJSON/ne_110m_land.json');
// const ne_110m_admin = require('../data/GeoJSON/ne_110m_admin_0_countries.json');

class Globe {
  constructor(width, height) {
    this.geojson = ne_110m_land;
    this.width = width;
    this.height = height;

    //create map container div
    this.mapContainer = d3.create('div')
      .classed('map-container', true);

    this.mapContainer
      .style('width', this.width+'px')
      .style('height', this.height+'px')
      .style('background', Globe.BACKGROUND_COLOUR)

    //create map svg
    this.mapSVG = this.mapContainer.append('svg')

    this.mapSVG.attr('viewBox', `0,0,${this.width},${this.height}`)
      .attr('width', `${this.width}`)
      .attr('height', `${this.height}`)

    this.mapSVG.append('g')
      .classed('map', true)

    this.mapSVG.append('g')
      .classed('graticule', true)

    //create graticule
    this.graticule = d3.geoGraticule();

    this.mapSVG.select('g.graticule')
      .append('path')
      .attr('stroke', Globe.GRATICULE_COLOUR)
      .attr('fill-opacity', '0')
      .attr('stroke-dasharray', Globe.GRATICULE_STROKE_DASHARRAY);

    //initial projection and path generator
    this.projection = d3.geoOrthographic()
      .fitExtent([[0, Globe.PADDING_TOP], [this.width, this.height - Globe.PADDING_BOTTOM]], this.geojson)
    
    this.geoGenerator = d3.geoPath()
      .projection(this.projection);
  }

  //generate and draw map and graticule paths
  draw() {
    this.mapSVG.select('g.map')
      .selectAll('path')
      .data(this.geojson.features)
      .join('path')
        .attr('d', this.geoGenerator)
        .attr('fill', Globe.MAP_COLOUR)
        .attr('stroke', Globe.MAP_BORDER_COLOUR)

    this.mapSVG.select('g.graticule path')
      .attr('d', this.geoGenerator(this.graticule()))
  }

  //get map container node
  node() {
    return this.mapContainer.node();
  }
}

Globe.PADDING_TOP = 50;
Globe.PADDING_BOTTOM = Globe.PADDING_TOP;

Globe.BACKGROUND_COLOUR = '#000000';
Globe.MAP_COLOUR = 'aqua';
Globe.MAP_BORDER_COLOUR = 'black';
Globe.GRATICULE_COLOUR = '#333333';
Globe.GRATICULE_STROKE_DASHARRAY = '2';

module.exports = {
  Globe
};