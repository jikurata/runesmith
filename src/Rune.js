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
   * @returns {Promise<ParsedHTMLDocument>}
   */
  inscribe(document) {
    return new Promise((resolve, reject) => {
      Errors.TypeError.check(this.handler, 'function');
      const returnValue = this.handler(document);
      // If the handler returns a Promise, wait for the promise to resolve
      if ( returnValue instanceof Promise ) {
        returnValue
        .then(() => resolve(document))
        .catch(err => reject(err))
      }
      else {
        resolve(document);
      }
    });
  }
}

module.exports = Rune;
