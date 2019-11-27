const Runesmith = require('./src/Runesmith.js');
const runesmith = new Runesmith();

/**
 * Compile the contents at the filepath
 * @param {String} filepath
 * @param {Object} options
 * options.emptyCache {Boolean}: Set to true to empty cache before compiling
 * @returns {String}
 */
function compile(filepath, options = {}) {
  if ( options.emptyCache ) {
    // Clear cache before compiling
    const keys = Object.keys(runesmith.cache);
    for ( let i = 0; keys.length; ++i ) {
      delete runesmith.cache[keys[i]];
    }
  }
  return runesmith.compile(filepath);
}

/**
 * Expand Runesmith's compile behavior
 * The handler receives a single argument, document {ParsedHTMLDocument}
 * Document can be modified through familiar DOM methods.
 * See https://github.com/jikurata/html-parser for the current implementation
 * @param {Function} handler 
 */
function rune(handler) {
  runesmith.rune('custom', handler);
}

module.exports = compile;
module.exports.rune = rune;
module.exports.map = runesmith.map;
