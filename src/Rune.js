'use strict';
const Errors = require('./Error.js');
const EventEmitter = require('events');

class Rune extends EventEmitter {
  /**
   * @param {ParsedHTMLDocument} document
   * @param {Function} handler,
   */
  constructor(handler) {
    super();
    Object.defineProperty(this, 'handler', {
      value: handler,
      enumerable: true,
      writable: false,
      configurable: false
    });
  }

  /**
   * Executes the handler function
   * @param {ParsedHTMLDocument} document
   * @returns {ParsedHTMLDocument}
   */
  inscribe(document) {
    Errors.TypeError.check(this.handler, 'function');
    this.handler(document);
    return document;
  }
}

module.exports = Rune;
