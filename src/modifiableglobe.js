const d3 = require("d3");

const {
  InteractiveGlobe
} = require('./interactiveglobe');

class ModifiableGlobe extends InteractiveGlobe {
  constructor(width, height) {
    super(width, height);

    this.points = [];
    this.highlightedCountries = [];
    this.svg.append('g')
      .classed('points', true)
      .attr('fill', 'red');
  }

  //generate and draw map and graticule paths
  draw() {
    this.startDrawTimer();

    let data = this.getData();
    this.drawCountries(data.countries);
    this.drawPoints(this.points);
    this.drawGraticule();
    this.drawRivers(data.rivers);
    this.drawLakes(data.lakes);

    this.endDrawTimer();
  }

  drawCountries(countries) {
    this.map.select('g.countries')
      .selectAll('path')
      .data(countries.features, d => d.properties.ISO_A3)
      .join('path')
      .classed('red-highlight', d => this.isHighlightedCountry(d, 'red'))
      .classed('green-highlight', d => this.isHighlightedCountry(d, 'green'))
      .attr('d', this.geoGenerator)
      .on('click', d => {
        console.log(d.properties.NAME);
        let lonlat = this.projection.invert([event.clientX, event.clientY]);

        if(this.pointMode)
          this.addPoint(lonlat);
        
        if(this.onclick)
          this.onclick(lonlat, d);
      });
  }

  drawPoints(points) {
    this.svg.select('g.points')
      .selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', point => this.getPointCoords(point)[0])
      .attr('cy', point => this.getPointCoords(point)[1])
      .attr('r', '5')
      .on('click', d => {
        if(this.pointMode) 
          this.removePoint(d);
      });
  }

  addPoint(lonlat, type = ModifiableGlobe.POINT_TYPE.VISIBLE_ON_HORIZON) {
    this.points.push({lonlat, type});
    this.drawPoints(this.points);
  }

  removePoint(targetPoint) {
    let i = this.points.findIndex(point => point.lonlat[0] == targetPoint.lonlat[0] && point.lonlat[1] == targetPoint.lonlat[1]);
    if (i < 0)
      throw 'Point not found';
    this.points.splice(i, 1);
    this.drawPoints(this.points);
  }

  getProjectionCenter() {
    return this.projection.invert([this.width / 2, this.height / 2]);
  }

  //if point is visible on globe, project normally
  //else project the point on the horizon closest to the actual point
  getPointCoords(point) {
    let lonlat = point.lonlat;

    switch (point.type) {
      case ModifiableGlobe.POINT_TYPE.ALWAYS_VISIBLE:
        break;
      case ModifiableGlobe.POINT_TYPE.INVISIBLE_BEYOND_HORIZON:
        if (!this.isPointVisible(lonlat))
          return [-10,-10];
        break;
      case ModifiableGlobe.POINT_TYPE.VISIBLE_ON_HORIZON:
        if (!this.isPointVisible(lonlat))
          lonlat = this.getHorizonPoint(lonlat);
        break;
    }
    return this.projection(lonlat);
  }

  //checks if the great circle distance between the projection center and the point is greater than pi/2 (over the horizon)
  isPointVisible(lonlat) {
    const center = this.getProjectionCenter();
    return d3.geoDistance(center, lonlat) <= Math.PI / 2;
  }

  //gets the point on the horizon along the great circle route from the projection center to the specified point
  getHorizonPoint(p) {
    const center = this.getProjectionCenter();
    return this.getWaypoint(center, p, Math.PI / 2);
  }

  //computes the waypoint p along the great circle route from p1 to p2 that has a central angle of σ1n with p1
  //SOURCE: https://en.wikipedia.org/wiki/Great-circle_navigation
  getWaypoint(p1, p2, σ1n) {
    const λ1 = p1[0] * Math.PI / 180;
    const λ2 = p2[0] * Math.PI / 180;

    const φ1 = p1[1] * Math.PI / 180;
    const φ2 = p2[1] * Math.PI / 180;

    let λ12 = λ2 - λ1;
    λ12 = λ12 > Math.PI ? λ12 - 2 * Math.PI : λ12;
    λ12 = λ12 < -Math.PI ? λ12 + 2 * Math.PI : λ12;

    //compute course α1
    const α1_n = Math.cos(φ2) * Math.sin(λ12);
    const α1_d = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ12);
    const α1 = Math.atan2(α1_n, α1_d);

    //extrapolate great circle p1-p2 to point A on equator
    const α0_n = Math.sin(α1) * Math.cos(φ1);
    const α0_d = Math.sqrt(Math.pow(Math.cos(α1), 2) + Math.pow(Math.sin(α1), 2) * Math.pow(Math.sin(φ1), 2));
    const α0 = Math.atan2(α0_n, α0_d);

    const σ01_n = Math.tan(φ1);
    const σ01_d = Math.cos(α1);
    const σ01 = Math.atan2(σ01_n, σ01_d);

    const λ01_n = Math.sin(α0) * Math.sin(σ01);
    const λ01_d = Math.cos(σ01);
    const λ01 = Math.atan2(λ01_n, λ01_d);
    let λ0 = λ1 - λ01;
    λ0 = λ0 > Math.PI ? λ0 - 2 * Math.PI : λ0;
    λ0 = λ0 < -Math.PI ? λ0 + 2 * Math.PI : λ0;

    //compute waypoint p on great circle p1-p2 that is distance σ from p1
    const σ = σ01 + σ1n;
    const φ_n = Math.cos(α0) * Math.sin(σ);
    const φ_d = Math.sqrt(Math.pow(Math.cos(σ), 2) + Math.pow(Math.sin(α0), 2) * Math.pow(Math.sin(σ), 2));
    const φ = Math.atan2(φ_n, φ_d);

    const λ0n_n = Math.sin(α0) * Math.sin(σ);
    const λ0n_d = Math.cos(σ);
    const λ0n = Math.atan2(λ0n_n, λ0n_d);
    let λ = λ0n + λ0;
    λ = λ > Math.PI ? λ - 2 * Math.PI : λ;
    λ = λ < -Math.PI ? λ + 2 * Math.PI : λ;

    return [λ * 180 / Math.PI, φ * 180 / Math.PI];
  }

  enableHighlightMode() {
    this.highlightMode = true;
    this.map.select('g.countries').classed('highlight', true);
  }

  disableHighlightMode() {
    this.highlightMode = false;
    this.map.select('g.countries').classed('highlight', false);
  }

  highlightCountry(ISO_A3, colour) {
    this.highlightedCountries.push({ISO_A3, colour});
  }

  clearHighlightedCountries() {
    this.highlightedCountries = [];
  }

  isHighlightedCountry(d, colour) {
    return this.highlightedCountries.findIndex(country => country.ISO_A3 == d.properties.ISO_A3 && country.colour == colour) >= 0
  }

  enablePointMode() {
    this.pointMode = true;
  }

  disablePointMode() {
    this.pointMode = false;
  }

  on(event, cb) {
    this['on'+event] = cb;
  }
}

ModifiableGlobe.POINT_TYPE = {
  ALWAYS_VISIBLE: 1,
  INVISIBLE_BEYOND_HORIZON: 2,
  VISIBLE_ON_HORIZON: 3
}

module.exports = {
  ModifiableGlobe
};