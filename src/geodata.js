class GeoData {
  constructor() {
    this.countries = GeoData.COUNTRIES_50M.features.map(feature => feature.properties);
    console.log(this.countries)
  }

  findCountry(ISO_A3) {
    return this.countries.find(country => country.ISO_A3 === ISO_A3);
  }

  getRandomCountries(numCountries) {
    return GeoData.getUniqueRandomArr(numCountries, GeoData.NUM_COUNTRIES).map(i => this.getCountry(i));
  }

  getRandomCountry() {
    return this.getCountry(GeoData.getRandomInt(GeoData.NUM_COUNTRIES));
  }

  getCountry(i) {
    return this.countries[i].ISO_A3;
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

GeoData.COUNTRIES_50M = require('../data/GeoJSON/ne_50m_admin_0_countries.json');
GeoData.COUNTRIES_110M = require('../data/GeoJSON/ne_110m_admin_0_countries_58.json');
GeoData.RIVERS_50M = require('../data/GeoJSON/ne_50m_rivers_lake_centerlines.json');
GeoData.RIVERS_110M = require('../data/GeoJSON/ne_110m_rivers_lake_centerlines_35.json');
GeoData.LAKES_50M = require('../data/GeoJSON/ne_50m_lakes.json');
GeoData.LAKES_110M = require('../data/GeoJSON/ne_110m_lakes_47.json');

GeoData.NUM_COUNTRIES = GeoData.COUNTRIES_50M.features.length;

module.exports = {
  GeoData
};