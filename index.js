const Runesmith = require('./src/Runesmith.js');
const runesmith = new Runesmith();

/**
 * Compile the contents at the filepath
 * @param {String} filepath
 * @returns {String}
 */
function compile(filepath) {
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

