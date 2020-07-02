const ModifiableGlobe = require('./modifiableglobe');

class GeoGlobe extends ModifiableGlobe {
  constructor() {
    super(window.innerWidth, window.innerHeight, GeoGlobe.PADDING);
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
  }

  moveToStartPosition(){
    let ty = (GeoGlobe.PADDING.bottom - GeoGlobe.PADDING.top)/2;
    this.transform(0, ty);
  }

  moveToGamePosition(){
    this.transform(0, 0);
  }

  moveToEndPosition() {
    let ty = (GeoGlobe.PADDING.bottom - GeoGlobe.PADDING.top)/2;

    let globeBounds = this.map.node().getBBox();
    let tx = -(this.windowWidth - globeBounds.width)/2 + 50;
    this.transform(tx, ty);
  }
}
GeoGlobe.PADDING = {
  left: 0,
  right: 0, 
  top: 150,
  bottom: 50
};

module.exports = GeoGlobe;