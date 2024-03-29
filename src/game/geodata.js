class GeoData {
  static isSameCountry(country1, country2) {
    let id1 = GeoData.getCountryId(country1);
    let id2 = GeoData.getCountryId(country2);
    return (id1 === id2);
  }

  static getCountryId(country) {
    return country.properties.NE_ID;
  }

  static getCountry(NE_ID) {
    return GeoData.ID_TO_COUNTRY_MAP[NE_ID];
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
    return GeoData.getUniqueRandomArr(num, GeoData.NUM_ELIGIBILE_COUNTRIES).map(i => GeoData.getEligibleCountry(i));
  }

  static getRandomCountry(difficulty) {
    let id = 0;
    switch(difficulty) {
      case GeoData.COUNTRY_DIFFICULTY.EASY:
        id = GeoData.EASY_COUNTRIES[GeoData.getRandomInt(GeoData.NUM_EASY_COUNTRIES)];
        break;
      case GeoData.COUNTRY_DIFFICULTY.NORMAL:
        id = GeoData.NORMAL_COUNTRIES[GeoData.getRandomInt(GeoData.NUM_NORMAL_COUNTRIES)];
        break;
      case GeoData.COUNTRY_DIFFICULTY.HARD:
        id = GeoData.HARD_COUNTRIES[GeoData.getRandomInt(GeoData.NUM_HARD_COUNTRIES)];
        break;
      default:
        id = GeoData.ELIGIBLE_COUNTRIES[GeoData.getRandomInt(GeoData.NUM_ELIGIBILE_COUNTRIES)];
    }
    return GeoData.ID_TO_COUNTRY_MAP[id];
  }

  static getEligibleCountry(i) {
    return GeoData.ID_TO_COUNTRY_MAP[GeoData.ELIGIBLE_COUNTRIES[i]];
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

GeoData.COUNTRIES_50M = require('../../data/OptimizedNEData/ne_50m_countries_adjusted.json');
GeoData.COUNTRIES_110M = require('../../data/OptimizedNEData/ne_110m_countries_adjusted.json');
GeoData.RIVERS_50M = require('../../data/NEData/GeoJSON/ne_50m_rivers_lake_centerlines.json');
GeoData.RIVERS_110M = require('../../data/NEData/GeoJSON/ne_110m_rivers_lake_centerlines_35.json');
GeoData.LAKES_50M = require('../../data/NEData/GeoJSON/ne_50m_lakes.json');
GeoData.LAKES_110M = require('../../data/NEData/GeoJSON/ne_110m_lakes_47.json');

GeoData.ADJACENCY_MAP = require('../../data/AdjacencyData/NECountryAdjacencyList.json');

GeoData.ELIGIBLE_COUNTRIES = require('../../data/OptimizedNEData/difficulty_countries_ids.json');
GeoData.EASY_COUNTRIES = GeoData.ELIGIBLE_COUNTRIES.easy;
GeoData.NORMAL_COUNTRIES = GeoData.ELIGIBLE_COUNTRIES.normal;
GeoData.HARD_COUNTRIES = GeoData.ELIGIBLE_COUNTRIES.hard;

GeoData.ELIGIBLE_COUNTRIES = [...GeoData.ELIGIBLE_COUNTRIES.easy, ...GeoData.ELIGIBLE_COUNTRIES.normal, ...GeoData.ELIGIBLE_COUNTRIES.hard]

GeoData.NUM_ELIGIBILE_COUNTRIES = GeoData.ELIGIBLE_COUNTRIES.length;
GeoData.NUM_EASY_COUNTRIES = GeoData.EASY_COUNTRIES.length;
GeoData.NUM_NORMAL_COUNTRIES = GeoData.NORMAL_COUNTRIES.length;
GeoData.NUM_HARD_COUNTRIES = GeoData.HARD_COUNTRIES.length;

GeoData.ID_TO_COUNTRY_MAP = {};
GeoData.COUNTRIES_50M.features.forEach(feature => GeoData.ID_TO_COUNTRY_MAP[feature.properties.NE_ID] = feature);

GeoData.COUNTRY_DIFFICULTY = {
  EASY: 1,
  NORMAL: 2,
  HARD: 3
};

module.exports = GeoData;