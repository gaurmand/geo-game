const GeoGame = require('./game/geogame');

let geoGame = new GeoGame();


window.onload = () => {
  geoGame.append();
};