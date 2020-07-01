const GeoGame = require('./geogame');
const GeoData = require('./geodata');

let geo = new GeoData();
let geoGame = new GeoGame(geo);
console.log(geo.findCountry('CAN'))
console.log(geo.getRandomCountries(10))
console.log(geo.getRandomCountry())
console.log(geo.getCountry(77))

window.onload = () => {
  geoGame.append();
};