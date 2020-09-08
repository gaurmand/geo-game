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

writeJSON(eligibleCountriesNames, path.join(__dirname,'/OptimizedNEData/eligible_countries_names.json'))
writeJSON(eligibleCountriesIds, path.join(__dirname,'/OptimizedNEData/eligible_countries_ids.json'))

//reduce 110m and 50m countries json file sizes by removing unneeded properties
ne_110m_countries.features.forEach(feature => feature.properties = filterProperties(feature.properties));
ne_50m_countries.features.forEach(feature => feature.properties = filterProperties(feature.properties));

function filterProperties(properties) {
  return {
    NAME: properties.NAME,
    NE_ID: properties.NE_ID
  }
}

writeJSON(ne_110m_countries, path.join(__dirname,'/OptimizedNEData/ne_110m_countries_adjusted.json'))
writeJSON(ne_50m_countries, path.join(__dirname,'/OptimizedNEData/ne_50m_countries_adjusted.json'))

//ne_id to geojson obj map (50m countries)
//better to construct client side then to send file to client since a lot of redundant data
let NEIDToGeoJSONMap = {};
ne_50m_countries.features.forEach(feature => NEIDToGeoJSONMap[feature.properties.NE_ID] = feature);

writeJSON(NEIDToGeoJSONMap, path.join(__dirname,'/OptimizedNEData/NEIDToGeoJSONMap.json'))
