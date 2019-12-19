const Runesmith = require('./src/Runesmith.js');
const rs = new Runesmith();

/**
 * Compile the contents at the filepath
 * @param {String} filepath
 * @returns {Promise<String>}
 */
function compile(filepath) {
  rs.clearMap();
  return rs.compile(filepath);
}

/**
 * Expand Runesmith's compile behavior
 * The handler receives a single argument, document {ParsedHTMLDocument}
 * Document can be modified through familiar DOM methods.
 * See https://github.com/jikurata/html-parser for the current implementation
 * @param {Function} handler 
 */
function rune(handler) {
  rs.rune('custom', handler);
}

function emptyCache() {
  rs.emptyCache();
}

module.exports = compile;
module.exports.config = rs.config;
module.exports.rune = rune;
module.exports.map = rs.map;
module.exports.emptyCache = emptyCache;
