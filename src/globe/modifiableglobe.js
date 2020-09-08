const d3 = require("d3");

const InteractiveGlobe = require('./interactiveglobe');

class ModifiableGlobe extends InteractiveGlobe {
  constructor(width, height, padding) {
    super(width, height, padding);

    this.points = [];
    this.circles = [];
    this.lines = [];
    this.highlightedCountries = [];

    this.svg.append('g')
      .classed('circles', true)
      .attr('fill', 'none');

    this.svg.append('g')
      .classed('lines', true)

    this.svg.append('g')
      .classed('points', true)
  }

  //generate and draw map and graticule paths
  draw() {
    this.startDrawTimer();

    let data = this.getData();
    this.drawCountries(data.countries);
    this.drawCircles(this.circles);
    this.drawPoints(this.points);
    this.drawLines(this.lines);
    this.drawGraticule();
    this.drawRivers(data.rivers);
    this.drawLakes(data.lakes);

    if(this.ondraw)
      this.ondraw();

    this.endDrawTimer();
  }

  drawCountries(countries) {
    this.map.select('g.countries')
      .selectAll('path')
      .data(countries.features, d => d.properties.NE_ID)
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

  drawGraticule() {
    this.map.select('g.graticule path')
      .attr('d', this.geoGenerator(this.graticule()))
      .on('click', () => {
        console.log('graticule');
        let lonlat = this.projection.invert([event.clientX, event.clientY]);

        if(this.pointMode)
          this.addPoint(lonlat);
        
        if(this.onclick)
          this.onclick(lonlat);
      });
  }

  drawCircles(circles) {
    this.svg.select('g.circles')
      .selectAll('path')
      .data(circles)
      .join('path')
      .attr('d', c => this.geoGenerator(c.circle()))
      .classed('green-circle', c => c.colour == 'green')
      .classed('red-circle', c => c.colour == 'red');
  }

  drawPoints(points) {
    this.svg.select('g.points')
      .selectAll('circle')
      .data(points)
      .join('circle')
      .attr('cx', point => this.getPointCoords(point)[0])
      .attr('cy', point => this.getPointCoords(point)[1])
      .attr('r', '3')
      .on('click', d => {
        if(this.pointMode) 
          this.removePoint(d);
      });
  }

  drawLines(lines) {
    this.svg.select('g.lines')
      .selectAll('path')
      .data(lines)
      .join('path')
      .attr('d', line => this.geoGenerator(line));
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

  clearPoints() {
    this.points = [];
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

  highlightCountry(country, colour) {
    this.highlightedCountries.push({NE_ID: country.properties.NE_ID, colour});

    let area = ModifiableGlobe.computeArea(country);
    if(area < ModifiableGlobe.THRESHOLD_AREA)
      this.addCircle(country, colour);
  }

  addCircle(country, colour) {
    let centroid =  d3.geoCentroid(country);
    let radius = Math.max(ModifiableGlobe.computeBoundingCircleRadius(country), ModifiableGlobe.MIN_CIRCLE_RADIUS)*180/Math.PI;

    let circle = d3.geoCircle()
      .center(centroid)
      .radius(radius);
    this.circles.push({circle, colour});
  }

  clearHighlightedCountries() {
    this.highlightedCountries = [];
    this.circles = [];
  }

  isHighlightedCountry(d, colour) {
    return this.highlightedCountries.findIndex(country => country.NE_ID == d.properties.NE_ID && country.colour == colour) >= 0
  }

  enablePointMode() {
    this.pointMode = true;
  }

  disablePointMode() {
    this.pointMode = false;
  }

  addLine(lonlat1, lonlat2) {
    this.lines.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [lonlat1, lonlat2]
      }
    });
  }

  clearLines() {
    this.lines = [];
  }

  on(event, cb) {
    this['on'+event] = cb;
  }

  transitionGlobe(rotationInterpolator, scaleInterpolator, length, cb) {
    super.transitionGlobe(rotationInterpolator, scaleInterpolator, length, cb);

    let r = rotationInterpolator;
    let s = scaleInterpolator;

    let globe = this;
    let circleInterpFactory = function(c) {
      return function(t) {
        if(r)
          globe.projection.rotate(r(t))
        if(s)
          globe.projection.scale(s(t))
        globe.geoGenerator.projection(globe.projection);
        return globe.geoGenerator(c.circle());
      }
    }

    let lineInterpFactory = function(l) {
      return function(t) {
        if(r)
          globe.projection.rotate(r(t))
        if(s)
          globe.projection.scale(s(t))
        globe.geoGenerator.projection(globe.projection);
        return globe.geoGenerator(l);
      }
    }

    let pointInterpFactory = function(point, index) {
      return function(t) {
        return globe.getPointCoords(point)[index];
      }
    }

    this.svg.select('g.circles')
      .selectAll("path")
      .transition()
      .attrTween("d", circleInterpFactory)
      .duration(length);

    this.svg.select('g.lines')
      .selectAll('path')
      .transition()
      .attrTween("d", lineInterpFactory)
      .duration(length);

    this.svg.select('g.points')
      .selectAll('circle')
      .transition()
      .attrTween("cx", point => pointInterpFactory(point, 0))
      .attrTween("cy", point => pointInterpFactory(point, 1))
      .duration(length);
  }

  static computeArea(country) {
    return d3.geoArea(country)*ModifiableGlobe.EARTH_RADIUS*ModifiableGlobe.EARTH_RADIUS; //convert steradians to sq km
  }

  static computeBoundingCircleRadius(country) {
    let centroid =  d3.geoCentroid(country);
    let bounds =  d3.geoBounds(country);

    let left = bounds[0][0]
    let bottom = bounds[0][1];
    let right = bounds[1][0];
    let top = bounds[1][1];

    let trdist = d3.geoDistance(centroid, [right, top]);
    let brdist = d3.geoDistance(centroid, [right, bottom]);
    let bldist = d3.geoDistance(centroid, [left, bottom]);
    let tldist = d3.geoDistance(centroid, [left, top]);

    return Math.max(trdist, brdist, bldist, tldist);
  }
}

ModifiableGlobe.POINT_TYPE = {
  ALWAYS_VISIBLE: 1,
  INVISIBLE_BEYOND_HORIZON: 2,
  VISIBLE_ON_HORIZON: 3
}

ModifiableGlobe.EARTH_RADIUS = 6371; //km
ModifiableGlobe.THRESHOLD_AREA = 10000; //sq km
ModifiableGlobe.MIN_CIRCLE_RADIUS = 100/ModifiableGlobe.EARTH_RADIUS; //100km in angular distance

module.exports = ModifiableGlobe;