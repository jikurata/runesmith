'use strict';
const EventEmitter = require('events');
const fsUtil = require('./fs-util.js');
const init = Symbol('init');

class Rune extends EventEmitter {
  /**
   * @param {Runesmith} runesmith
   * @param {String} tag
   * @param {String|Filepath} source,
   * @param {RuneOptions} options
   */
  constructor(runesmith, tag, options = {}) {
    super();
    Object.defineProperty(this, 'runesmith', {
      value: runesmith,
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'tag', {
      value: tag,
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'effect', {
      value: options.effect || [],
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'source', {
      value: options.source || null,
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'partial', {
      value: options.partial || null,
      enumerable: true,
      writable: false,
      configurable: false
    });
    this[init]();
  }

  [init]() {
    // Save the partial from source if available
    if ( !this.partial && this.source ) {
      this.partial = fsUtil.readHtmlFile(this.source);
    }
  }

  /**
   * Process the element and return the results
   * @param {ParsedElement} element
   * @returns {String}
   */
  invoke(element) {
    let partial = this.partial;
    for ( let i = 0; i < this.effect.length; ++i ) {
      partial = this.effect[i](partial, element);
    }
    return partial;
  }
}

module.exports = Rune;
