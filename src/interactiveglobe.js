const d3 = require("d3");

const {
  Globe
} = require('./globe');

const {
  GeoData
} = require('./geodata');

class InteractiveGlobe extends Globe {
  constructor(width, height) {
    super(width, height);

    //zoom & pan interactivity
    this.interaction = true;
    this.lastZoom = 0;
    this.lastTransform = {
      k: 1,
      x: 0,
      y: 0
    };
    this.isZooming = false;

    this.zoom = d3.zoom()
      .scaleExtent([InteractiveGlobe.MIN_SCALE / this.initialScale, InteractiveGlobe.MAX_SCALE / this.initialScale])
      .on('zoom', () => {
        if (d3.event.sourceEvent instanceof WheelEvent) {
          //interactive scaling

          d3.event.transform.x = this.lastTransform.x;
          d3.event.transform.y = this.lastTransform.y;

          let newScale = this.computeScale(d3.event.transform);
          this.scaleProjection(newScale);
        } else {
          //interactive rotation

          let delta = Date.now() - this.lastZoom
          if (delta < InteractiveGlobe.ROTATION_UPDATE_INTERVAL)
            return;

          let rotation = this.computeRotation(d3.event.transform, this.lastTransform);
          this.rotateProjection(rotation);

          this.lastZoom = Date.now();
          this.lastTransform = d3.event.transform;
        }
      })
      .on('start', () => {
        this.isZooming = true;

        //stop auto rotating on mousedown
        if (this.isAutoRotating())
          this.stopAutoRotate();

      })
      .on('end', () => {
        this.isZooming = false;

        //draw after zooming to show high resolution map data
        this.draw();
      });

    //set zoom behaviour 
    this.svg.call(this.zoom)
      .on('dblclick.zoom', null); //disable double click zooming

    //autorotate
    this.autoRotating = true;
    this.autoRotateTimer = null;
  }

  //given two screen coordinates (of a drag gesture), calculate the new projection rotation
  computeRotation(transform, lastTransform) {
    const rotation = this.projection.rotate();
    const scale = this.projection.scale();
    const rotationFactor = (InteractiveGlobe.ROTATION_SCALE_CONSTANT / scale); //change in rotation should be inversely proportional to scale

    let deltaX = transform.x - lastTransform.x;
    let deltaY = transform.y - lastTransform.y;

    let λ = rotation[0] + deltaX * rotationFactor;
    let φ = rotation[1] + -deltaY * rotationFactor;
    let γ = rotation[2];

    φ = φ > InteractiveGlobe.MAX_LATITUDE ? InteractiveGlobe.MAX_LATITUDE : φ;
    φ = φ < InteractiveGlobe.MIN_LATITUDE ? InteractiveGlobe.MIN_LATITUDE : φ;

    return [λ, φ, γ];
  }

  computeScale(transform) {
    return this.initialScale * transform.k;
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

  isInteractionEnabled() {
    return this.interaction;
  }

  disableInteraction() {
    this.interaction = true;
    this.svg.on('.zoom', null);
  }

  enableInteraction() {
    this.interaction = false;
    this.svg.call(this.zoom)
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


  getData() {
    let countries, rivers, lakes;
    const scale = this.projection.scale();

    if (this.isZooming || scale < InteractiveGlobe.SCALE_THRESHOLD) {
      countries = GeoData.COUNTRIES_110M;
      rivers = GeoData.RIVERS_110M;
      lakes = GeoData.LAKES_110M;
    } else {
      countries = GeoData.COUNTRIES_50M;
      rivers = GeoData.RIVERS_50M;
      lakes = GeoData.LAKES_50M;
    }

    return {
      countries,
      rivers,
      lakes
    };
  }
}

//INTERACTION CONSTANTS
InteractiveGlobe.MAX_LATITUDE = 66.5;
InteractiveGlobe.MIN_LATITUDE = -InteractiveGlobe.MAX_LATITUDE;

InteractiveGlobe.MAX_SCALE = 3500;
InteractiveGlobe.MIN_SCALE = 300;

InteractiveGlobe.SCALE_THRESHOLD = 1000;

InteractiveGlobe.ROTATION_UPDATE_INTERVAL = 20;
InteractiveGlobe.ROTATION_SPEED = 250;

InteractiveGlobe.SCALE_CHANGE_CONSTANT = 1 / 6;
InteractiveGlobe.ROTATION_SCALE_CONSTANT = 90;

module.exports = {
  InteractiveGlobe
};