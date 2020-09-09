require('./css/about.css');
require('./css/common.css');
require('./css/endoverlay.css');
require('./css/gameinfobar.css');
require('./css/globe.css');
require('./css/questionresult.css');
require('./css/startoverlay.css');
require('./css/gamesetup.css');

const GeoGame = require('./game/geogame');

let geoGame = new GeoGame();


window.onload = () => {
  geoGame.append();
};