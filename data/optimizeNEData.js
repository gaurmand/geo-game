const {
  readJSON,
  writeJSON
} = require('./common.js');

const path = require('path');

let ne_110m_countries = readJSON(path.join(__dirname,'/NEData/GeoJSON/ne_110m_admin_0_countries_58.json'));
let ne_50m_countries = readJSON(path.join(__dirname,'/NEData/GeoJSON/ne_50m_admin_0_countries.json'));

//eligible country array
let eligibleCountries = ne_50m_countries.features.filter(feature => {
  let props = feature.properties;
  switch(props.TYPE) {
    case 'Country':
      //exclude non-sovereign countries (e.g. Hong Kong, Macao, Curacao, Aruba, etc.)
      return (props.SOVEREIGNT === props.ADMIN);
    case 'Sovereign country':
      //reject N. Cyprus (should be disputed)
      return (props.NAME !== 'N. Cyprus');
    case 'Dependency':
    case 'Disputed':
    case 'Indeterminate':
    default:
      return false;
  }
});

let eligibleCountriesNames = eligibleCountries.map(feature => feature.properties.NAME);
let eligibleCountriesIds = eligibleCountries.map(feature => feature.properties.NE_ID);

writeJSON(eligibleCountriesNames, path.join(__dirname,'/OptimizedNEData/eligible_countries_names.json'));
writeJSON(eligibleCountriesIds, path.join(__dirname,'/OptimizedNEData/eligible_countries_ids.json'));

//add difficulty properties
const d3 = require("d3");
eligibleCountries.forEach(country => {
  country.properties.AREA = d3.geoArea(country)*6371*6371;
  country.properties.POPULATION = country.properties.POP_EST;
  country.properties.GDP = country.properties.GDP_MD_EST;
});

let populationRankedCountries = eligibleCountries.slice().sort((a, b) => b.properties.POPULATION - a.properties.POPULATION);
let areaRankedCountries = eligibleCountries.slice().sort((a, b) => b.properties.AREA - a.properties.AREA);
let GDPRankedCountries = eligibleCountries.slice().sort((a, b) => b.properties.GDP - a.properties.GDP);

populationRankedCountries.forEach((pCountry, index) => pCountry.properties.POPULATION_RANK = index+1)
areaRankedCountries.forEach((aCountry, index) => aCountry.properties.AREA_RANK = index+1)
GDPRankedCountries.forEach((gCountry, index) => gCountry.properties.GDP_RANK = index+1)

eligibleCountries.forEach(country => {
  country.properties.DIFFICULTY = country.properties.POPULATION_RANK + country.properties.AREA_RANK + country.properties.GDP_RANK;
});

let difficultyRankedCountries = eligibleCountries.slice().sort((a, b) => a.properties.DIFFICULTY - b.properties.DIFFICULTY);

let numCountries = difficultyRankedCountries.length;
let numDifficultyQuestions = Math.round(numCountries/3);

let easyCountries = difficultyRankedCountries.slice(0, numDifficultyQuestions);
let normalCountries = difficultyRankedCountries.slice(numDifficultyQuestions, 2*numDifficultyQuestions);
let hardCountries = difficultyRankedCountries.slice(2*numDifficultyQuestions);

let difficultyRankedCountryNames = {
  easy: easyCountries.map(feature => feature.properties.NAME),
  normal: normalCountries.map(feature => feature.properties.NAME),
  hard: hardCountries.map(feature => feature.properties.NAME)
};

let difficultyRankedCountryIds = {
  easy: easyCountries.map(feature => feature.properties.NE_ID),
  normal: normalCountries.map(feature => feature.properties.NE_ID),
  hard: hardCountries.map(feature => feature.properties.NE_ID)
};

writeJSON(difficultyRankedCountryNames, path.join(__dirname,'/OptimizedNEData/difficulty_countries_names.json'));
writeJSON(difficultyRankedCountryIds, path.join(__dirname,'/OptimizedNEData/difficulty_countries_ids.json'));

//reduce 110m and 50m countries json file sizes by removing unneeded properties
ne_110m_countries.features.forEach(feature => feature.properties = filterProperties(feature.properties));
ne_50m_countries.features.forEach(feature => feature.properties = filterProperties(feature.properties));

function filterProperties(properties) {
  return {
    NAME: properties.NAME,
    NE_ID: properties.NE_ID
  }
}

writeJSON(ne_110m_countries, path.join(__dirname,'/OptimizedNEData/ne_110m_countries_adjusted.json'));
writeJSON(ne_50m_countries, path.join(__dirname,'/OptimizedNEData/ne_50m_countries_adjusted.json'));

//ne_id to geojson obj map (50m countries)
//better to construct client side then to send file to client since a lot of redundant data
let NEIDToGeoJSONMap = {};
ne_50m_countries.features.forEach(feature => NEIDToGeoJSONMap[feature.properties.NE_ID] = feature);

writeJSON(NEIDToGeoJSONMap, path.join(__dirname,'/OptimizedNEData/NEIDToGeoJSONMap.json'));
