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

    this.mapContainer = d3.create('div')
      .classed('map-container', true);

    this.mapContainer
      .style('width', '100vw')
      .style('height', '100vh')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('background', 'black')

    this.mapSVG = this.mapContainer.append('svg')

    this.mapSVG.attr('viewBox', `0,0,${this.width},${this.height}`)
      .attr('width', `${this.width}`)
      .attr('height', `${this.height}`)

    this.mapSVG.append('g')
      .classed('map', true)

    this.projection = d3.geoOrthographic()
      .fitExtent([[0,Globe.PADDING_TOP],[this.width, this.height-Globe.PADDING_BOTTOM]], this.geojson)
  }

  draw() {
    let geoGenerator = d3.geoPath()
      .projection(this.projection);

    this.mapSVG.select('g.map')
      .selectAll('path')
      .data(this.geojson.features)
      .join('path')
        .attr('d', geoGenerator)
        .attr('fill', 'aqua')
        .attr('stroke', 'black')
  }

  node() {
    return this.mapContainer.node();
  }
}

Globe.PADDING_TOP = 50;
Globe.PADDING_BOTTOM = Globe.PADDING_TOP;

module.exports = {
  Globe
};