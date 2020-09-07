const GeoGame = require('./game/geogame');
require('./css/style.css');

let geoGame = new GeoGame();


window.onload = () => {
  geoGame.append();
};