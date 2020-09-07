const fs = require('fs');
const path = require('path');

var countries = JSON.parse(fs.readFileSync(path.join(__dirname,'/GeoJSON/ne_50m_admin_0_countries.json'), 'utf-8')).features;
var nameAdjacencyMap = JSON.parse(fs.readFileSync(path.join(__dirname,'/country_adj.json'), 'utf-8'));

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
fs.writeFileSync(path.join(__dirname,'/NECountryAdjacencyList.json'), JSON.stringify(idAdjacencyMap));