const {Globe} = require('./globe');

// const ne_10m_land = require('../data/GeoJSON/ne_10m_land.json');
// const ne_50m_land = require('../data/GeoJSON/ne_50m_land.json');
const ne_110m_land = require('../data/GeoJSON/ne_110m_land.json');
// const ne_110m_admin = require('../data/GeoJSON/ne_110m_admin_0_countries.json');

let globe = new Globe(window.innerWidth, window.innerHeight, ne_110m_land);
document.body.appendChild(globe.node());
document.body.style.setProperty('margin', '0')