class GeoData {
  static isSameCountry(country1, country2) {
    let id1 = GeoData.getCountryId(country1);
    let id2 = GeoData.getCountryId(country2);
    return (id1 === id2);
  }

  static getCountryId(country) {
    let props = country.properties;
    switch(props.TYPE) {
      case GeoData.COUNTRY_TYPE.COUNTRY:
      case GeoData.COUNTRY_TYPE.SOVEREIGN_COUNTRY:
      case GeoData.COUNTRY_TYPE.DISPUTED:
      case GeoData.COUNTRY_TYPE.INDETERMINATE:
        return props.ADM0_A3;
      case GeoData.COUNTRY_TYPE.DEPENDENCY:
        return props.SOV_A3;
      default:
        throw 'Unknown feature type';
    }
  }

  static findCountry(NE_ID) {
    return GeoData.ELIGIBILE_QUESTION_COUNTRIES.find(country => country.properties.NE_ID === NE_ID);
  }

  static isAdjacentCountry(c1, c2) {
    let adjacencyList = GeoData.ADJACENCY_MAP[c1.properties.NE_ID];
    if(!adjacencyList) {
      console.error(`isAdjacentCountry() error: ${c1.properties.NAME} (${c1.properties.NE_ID}) adjacency list not found`)
      return false;
    }
    return GeoData.ADJACENCY_MAP[c1.properties.NE_ID].find(NE_ID => NE_ID === c2.properties.NE_ID);
  }

  static getRandomCountries(num) {
    return GeoData.getUniqueRandomArr(num, GeoData.NUM_ELIGIBILE_QUESTION_COUNTRIES).map(i => GeoData.getCountry(i));
  }

  static getRandomCountry() {
    return GeoData.getCountry(GeoData.getRandomInt(GeoData.NUM_ELIGIBILE_QUESTION_COUNTRIES));
  }

  static getCountry(i) {
    return GeoData.ELIGIBILE_QUESTION_COUNTRIES[i];
  }

  static getUniqueRandomArr(numElems, max) {
    if(numElems <= 0)
      throw 'numElems < 0';

    if(max <= 0)
      throw 'max < 0';

    let res = [];

    while(res.length < numElems) {
      let newElem = GeoData.getRandomInt(max);
      if(res.indexOf(newElem) == -1)
        res.push(newElem);
    }

    return res;
  }

  static getRandomArr(numElems, max) {
    return new Array(numElems).fill(0).map(() => GeoData.getRandomInt(max));
  }

  static getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
}

GeoData.COUNTRIES_50M = require('../../data/GeoJSON/ne_50m_admin_0_countries.json');
GeoData.COUNTRIES_110M = require('../../data/GeoJSON/ne_110m_admin_0_countries_58.json');
GeoData.RIVERS_50M = require('../../data/GeoJSON/ne_50m_rivers_lake_centerlines.json');
GeoData.RIVERS_110M = require('../../data/GeoJSON/ne_110m_rivers_lake_centerlines_35.json');
GeoData.LAKES_50M = require('../../data/GeoJSON/ne_50m_lakes.json');
GeoData.LAKES_110M = require('../../data/GeoJSON/ne_110m_lakes_47.json');

GeoData.COUNTRY_TYPE = {
  COUNTRY: 'Country',
  SOVEREIGN_COUNTRY: 'Sovereign country',
  DEPENDENCY: 'Dependency',
  DISPUTED: 'Disputed',
  INDETERMINATE: 'Indeterminate' 
};

GeoData.SOVEREIGN_COUNTRIES = [];
GeoData.COUNTRIES = [];
GeoData.DEPENDENCIES = [];
GeoData.DISPUTED_COUNTRIES = [];
GeoData.INDETERMINATE_COUNTRIES = [];

GeoData.COUNTRIES_50M.features.forEach(feature => {
  let props = feature.properties;
  switch(props.TYPE) {
    case GeoData.COUNTRY_TYPE.COUNTRY:
      GeoData.COUNTRIES.push(feature);
      break;
    case GeoData.COUNTRY_TYPE.SOVEREIGN_COUNTRY:
      GeoData.SOVEREIGN_COUNTRIES.push(feature);
      break;
    case GeoData.COUNTRY_TYPE.DEPENDENCY:
      GeoData.DEPENDENCIES.push(feature);
      break;
    case GeoData.COUNTRY_TYPE.DISPUTED:
      GeoData.DISPUTED_COUNTRIES.push(feature);
      break;
    case GeoData.COUNTRY_TYPE.INDETERMINATE:
      GeoData.INDETERMINATE_COUNTRIES.push(feature);
      break;
    default:
      throw 'Unknown feature type';
  }
});

// console.log(GeoData.SOVEREIGN_COUNTRIES)
// console.log(GeoData.COUNTRIES)
// console.log(GeoData.DEPENDENCIES)
// console.log(GeoData.DISPUTED_COUNTRIES)
// console.log(GeoData.INDETERMINATE_COUNTRIES)

GeoData.ELIGIBILE_QUESTION_COUNTRIES = [...GeoData.SOVEREIGN_COUNTRIES, ...GeoData.COUNTRIES];
GeoData.ELIGIBILE_QUESTION_COUNTRIES = GeoData.ELIGIBILE_QUESTION_COUNTRIES.filter(feature => {
  let props = feature.properties;
  switch(props.TYPE) {
    case GeoData.COUNTRY_TYPE.COUNTRY:
      //exclude non-sovereign countries (e.g. Hong Kong, Macao, Curacao, Aruba, etc.)
      return (props.SOVEREIGNT === props.ADMIN);
    case GeoData.COUNTRY_TYPE.SOVEREIGN_COUNTRY:
      return true;
    default:
      throw 'Unknown feature type';
  }
})
console.log(GeoData.ELIGIBILE_QUESTION_COUNTRIES.map(country => country.properties.NAME).sort())

GeoData.NUM_ELIGIBILE_QUESTION_COUNTRIES = GeoData.ELIGIBILE_QUESTION_COUNTRIES.length;

GeoData.ADJACENCY_MAP = require('../../data/NECountryAdjacencyList.json');

module.exports = GeoData;