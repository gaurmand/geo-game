const fs = require('fs');

function readJSON(path) {
  let output = fs.readFileSync(path, 'utf-8');
  return JSON.parse(output);
}

function writeJSON(obj, path) {
  let json = JSON.stringify(obj);
  fs.writeFileSync(path, json, 'utf-8');
}

module.exports = {
  readJSON, 
  writeJSON
};