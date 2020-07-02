const ModifiableGlobe = require('./modifiableglobe');

class GeoGlobe extends ModifiableGlobe {
  constructor() {
    super(window.innerWidth, window.innerHeight, GeoGlobe.PADDING);
  }

  moveToStartPosition(){
    let ty = (GeoGlobe.PADDING.bottom - GeoGlobe.PADDING.top)/2
    this.transform(0, ty);
  }

  moveToGamePosition(){
    this.transform(0, 0);
  }
}
GeoGlobe.PADDING = {
  left: 0,
  right: 0, 
  top: 150,
  bottom: 50
};

module.exports = GeoGlobe;