const d3 = require("d3");

const ne_50m_admin_0_countries = require('../data/GeoJSON/ne_50m_admin_0_countries.json');
const ne_110m_admin_0_countries = require('../data/GeoJSON/ne_110m_admin_0_countries_58.json');

const ne_110m_rivers_lake_centerlines = require('../data/GeoJSON/ne_110m_rivers_lake_centerlines_35.json');
const ne_50m_rivers_lake_centerlines = require('../data/GeoJSON/ne_50m_rivers_lake_centerlines.json');

const ne_110m_lakes = require('../data/GeoJSON/ne_110m_lakes_47.json');
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

    this.points = [];
    this.mapSVG.append('g')
      .classed('points', true)
      .attr('fill', 'red');

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
    this.interaction = true;
    this.lastZoom = 0;
    this.lastTransform = {k: 1, x: 0, y: 0};
    this.isZooming = false;

    this.zoom = d3.zoom()
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

        //stop auto rotating on mousedown
        if(this.isAutoRotating())
          this.stopAutoRotate();

      })
      .on('end', () => {
        this.isZooming = false;

        //draw after zooming to show high resolution map data
        this.draw();
      });

    //set zoom behaviour (disable double click zooming)
    this.mapSVG.call(this.zoom)
      .on('dblclick.zoom', null);

    //make globe auto rotate on start
    this.autoRotating = true;
    this.autoRotateTimer = null;
    this.startAutoRotate();
  }

  //generate and draw map and graticule paths
  draw() {
    let start = Date.now();

    let data = this.getData();
    this.drawCountries(data.countries);
    this.drawPoints(this.points);
    this.drawGraticule();
    this.drawRivers(data.rivers);
    this.drawLakes(data.lakes);

    let delta = Date.now() - start;
    this.drawTime += delta;
    this.numDraws++;
    let avgDrawTime = this.drawTime/this.numDraws;

    if(Globe.DEBUG) {
      console.log('draw time: ' + delta);
      console.log('avg draw time: ' + avgDrawTime);
    }
  }

  drawCountries(countries) {
    this.mapSVG.select('g.countries')
      .selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('d', this.geoGenerator)
      .on('click', d => {
        console.log(d.properties.NAME);
        let lonlat = this.projection.invert([event.clientX, event.clientY]);
        console.log(lonlat);
        this.addPoint(lonlat);
      });
  }

  drawPoints(points) {
    this.mapSVG.select('g.points')
    .selectAll('circle')
    .data(points)
    .join('circle')
      .attr('cx', city => this.projectPoint(city)[0])
      .attr('cy', city => this.projectPoint(city)[1])
      .attr('r', '5')
      .on('click', d => {
        this.removePoint(d);
      });
  }

  drawGraticule() {
    this.mapSVG.select('g.graticule path')
      .attr('d', this.geoGenerator(this.graticule()));
  }

  drawRivers(rivers) {
    this.mapSVG.select('g.rivers')
      .selectAll('path')
      .data(rivers.features)
      .join('path')
      .attr('d', this.geoGenerator);
  }

  drawLakes(lakes) {
    this.mapSVG.select('g.lakes')
      .selectAll('path')
      .data(lakes.features)
      .join('path')
      .attr('d', this.geoGenerator);
  }

  //get map container node
  node() {
    return this.mapContainer.node();
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

    if(this.isZooming || scale < Globe.SCALE_THRESHOLD) {
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

  isInteractionEnabled() {
    return this.interaction;
  }

  disableInteraction() {
    this.interaction = true;
    this.mapSVG.on('.zoom', null);
  }

  enableInteraction() {
    this.interaction = false;
    this.mapSVG.call(this.zoom)
      .on('dblclick.zoom', null);
  }

  isAutoRotating() {
    return this.autoRotating;
  }

  startAutoRotate(ccw = false) {
    this.autoRotating = true;
    this.autoRotateTimer = d3.interval(() => {
      const rotation = this.projection.rotate();
      let newRotation = rotation;

      let deltaλ = ccw ? -0.5 : 0.5;
      newRotation[0] += deltaλ;
      this.rotateProjection(newRotation);
    }, 30);
  }

  stopAutoRotate() {
    this.autoRotating = false;
    this.autoRotateTimer.stop()
  }

  addPoint(point) {
    this.points.push(point);
    this.drawPoints(this.points);
  }

  removePoint(point) {
    let i = this.points.indexOf(point);
    if(i == -1)
      throw 'Point not found';
    this.points.splice(i, 1);
    this.drawPoints(this.points);
  }

  getProjectionCenter() {
    return this.projection.invert([this.width/2, this.height/2]);
  }

  //if point is visible on globe, project normally
  //else project the point on the horizon closest to the actual point
  projectPoint(lonlat) {
    if(!this.isPointVisible(lonlat))
      lonlat = this.getHorizonPoint(lonlat);
    return this.projection(lonlat);
  }

  //checks if the great circle distance between the projection center and the point is greater than pi/2 (over the horizon)
  isPointVisible(lonlat) {
    const center = this.getProjectionCenter();
    return d3.geoDistance(center, lonlat) <= Math.PI/2;
  }

  //gets the point on the horizon along the great circle route from the projection center to the specified point
  getHorizonPoint(p) {
    const center = this.getProjectionCenter();
    return this.getWaypoint(center, p, Math.PI/2);
  }

  //computes the waypoint p along the great circle route from p1 to p2 that has a central angle of σ1n with p1
  getWaypoint(p1, p2, σ1n) {
    const λ1 = p1[0] * Math.PI / 180;
    const λ2 = p2[0] * Math.PI / 180;

    const φ1 = p1[1] * Math.PI / 180;
    const φ2 = p2[1] * Math.PI / 180;

    let λ12 = λ2 - λ1;
    λ12 = λ12 > Math.PI ? λ12 - 2*Math.PI : λ12;
    λ12 = λ12 < -Math.PI ? λ12 + 2*Math.PI : λ12;

    //compute course α1
    const α1_n = Math.cos(φ2) * Math.sin(λ12);
    const α1_d = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ12);
    const α1 = Math.atan2(α1_n, α1_d);

    //extrapolate great circle p1-p2 to point A on equator
    const α0_n = Math.sin(α1) * Math.cos(φ1);
    const α0_d = Math.sqrt(Math.pow(Math.cos(α1), 2) + Math.pow(Math.sin(α1), 2) * Math.pow(Math.sin(φ1), 2) );
    const α0 = Math.atan2(α0_n, α0_d);

    const σ01_n = Math.tan(φ1);
    const σ01_d = Math.cos(α1);
    const σ01 = Math.atan2(σ01_n, σ01_d);

    const λ01_n = Math.sin(α0) * Math.sin(σ01);
    const λ01_d = Math.cos(σ01);
    const λ01 = Math.atan2(λ01_n, λ01_d);
    let λ0 = λ1 - λ01;
    λ0 = λ0 > Math.PI ? λ0 - 2*Math.PI : λ0;
    λ0 = λ0 < -Math.PI ? λ0 + 2*Math.PI : λ0;

    //compute waypoint p on great circle p1-p2 that is distance σ from p1
    const σ = σ01 + σ1n;
    const φ_n = Math.cos(α0) * Math.sin(σ);
    const φ_d = Math.sqrt(Math.pow(Math.cos(σ), 2) + Math.pow(Math.sin(α0), 2) * Math.pow(Math.sin(σ), 2) );
    const φ = Math.atan2(φ_n, φ_d);

    const λ0n_n = Math.sin(α0) * Math.sin(σ);
    const λ0n_d = Math.cos(σ);
    const λ0n = Math.atan2(λ0n_n, λ0n_d);
    let λ = λ0n + λ0;
    λ = λ > Math.PI ? λ - 2*Math.PI : λ;
    λ = λ < -Math.PI ? λ + 2*Math.PI : λ;

    return [λ*180/Math.PI, φ*180/Math.PI];
  }
}

//MAP CONSANTS
Globe.PADDING_TOP = 50;
Globe.PADDING_BOTTOM = Globe.PADDING_TOP;

Globe.MAX_LATITUDE = 66.5;
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
Globe.MAX_SCALE = 3500;
Globe.MIN_SCALE = 300;

Globe.SCALE_THRESHOLD = 1000;

Globe.ROTATION_UPDATE_INTERVAL = 20;
Globe.ROTATION_SPEED = 250;

Globe.SCALE_CHANGE_CONSTANT = 1/6;
Globe.ROTATION_SCALE_CONSTANT = 90;

module.exports = {
  Globe
};