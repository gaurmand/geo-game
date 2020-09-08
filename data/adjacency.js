const {
  readJSON,
  writeJSON
} = require('./common.js');

const path = require('path');

let countries = readJSON(path.join(__dirname,'/NEData/GeoJSON/ne_50m_admin_0_countries.json')).features;
let nameAdjacencyMap = readJSON(path.join(__dirname,'/AdjacencyData/country_adj.json'));

let countriesMap = {};
countries.forEach(country => countriesMap[country.properties.NAME] = country.properties.NE_ID);

// console.log(countries)
// console.log(nameAdjacencyMap)

//convert name adjacency map to id adjacency map and write to file
function getId(name) {
  return countriesMap[name];
}

var idAdjacencyMap = {};
for (const [countryName, adjacentList] of Object.entries(nameAdjacencyMap)) {
  idAdjacencyMap[getId(countryName)] = adjacentList.map(cname => getId(cname));
}

// console.log(idAdjacencyMap)
writeJSON(idAdjacencyMap, path.join(__dirname,'/AdjacencyData/NECountryAdjacencyList.json'));