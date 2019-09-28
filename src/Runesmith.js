'use strict';
const EventEmitter = require('events');
const HtmlParser = require('@jikurata/html-parser');
const fsUtil = require('./fs-util.js');
const Errors = require('./Error.js');
const Rune = require('./Rune.js');
const init = Symbol('init');

class Runesmith extends EventEmitter {
  constructor(options = {}) {
    super();
    Object.defineProperty(this, 'parser', {
      value: new HtmlParser(),
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'runes', {
      value: {},
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'queue', {
      value: [],
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'cache', {
      value: {},
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, 'map', {
      value: {},
      enumerable: true,
      writable: false,
      configurable: false
    });
    this[init]();
  }

  [init]() {
    // Declare default runes
  }

  /**
   * Create a new rune to add to Runesmith's vocabulary
   * @param {String} tag 
   * @param {String|Filepath} file 
   * @param {RuneOptions} options 
   * @returns {Rune}
   */
  rune(tag, options = {}) {
    // Throw if tag is invalid
    Errors.InvalidTag.isValidTag(tag);
    
    tag = tag.trim();
    const o = {
      file: options.file || null,
      content: options.content || null
    };

    const rune = new Rune(this, tag, o);
    this.runes[tag] = rune;
    return rune
  }

  /**
   * Parses and compiles the file or string.
   * @param {String|Filepath} file 
   * @returns {String}
   */
  compile(file, options = {}) {
    this.queue.push(file);

    // Establish namespace
    const namespace = options.namespace || {};

    let content = '';
    while ( this.queue.length ) {
      const path = this.queue.shift();
      const filepath = fsUtil.resolveToProjectPath(path);

      // Retrieve contents of html file
      let html = '';
      if ( this.cache.hasOwnProperty(filepath) ) {
        html = this.cache[filepath];
      }
      html = fsUtil.readHtmlFile(filepath);

      content = this.parse(html, {
        namespace: namespace
      });
    }

    return content;
  }

  parse(content, options = {}) {
    const document = this.parser.parse(content);
    
    let namespace = options.namespace || {};
    // Set namespace
    const namespaceElements = document.getElementsByTagName('namespace');
    for ( let i = 0; i < namespaceElements.length; ++i ) {
      const e = namespaceElements[i];
      namespace = this.parseNamespace(e, namespace);

      // Remove namespace element from html
      content = content.replace(e.content, '');
    }
    
    // Replace var elements with their namespace values
    const varElements = document.getElementsByTagName('var');
    for ( let i = 0; i < varElements.length; ++i ) {
      const e = varElements[i];
      const value = this.parseVar(e, namespace) || '';
      
      // Replace var element with its namespace value
      content = content.replace(e.content, value);
    }

    // Pass content through each rune
    const keys = Object.keys(this.runes);
    for ( let i = 0; i < keys.length; ++i ) {
      const key = keys[i];
      if ( key === 'namespace' || key === 'var' ) {
        continue;
      }
      const rune = this.runes[keys[i]]
      const elements = document.getElementsByTagName(key);
      for ( let j = 0; j < elements.length; ++j ) {
        const element = elements[i];
        const result = rune.invoke(element) || '';
        const substring = content.substring(element.source.startIndex, element.source.endIndex);
        content = content.replace(substring, result);
      }
    }

    return content;
  }

  /**
   * Parses the namespace element for key value pairs
   * @param {ParsedHTMLElement} element 
   * @param {Namespace} namespace
   * @returns {Namespace}
   */
  parseNamespace(element, namespace = {}) {
    // TODO: Add type checks
    // Set namespace configurations from element attributes
    const delimiterString = (element.attributes.hasOwnProperty('delimiter') && element.getAttribute('delimiter').trim()) 
      ? element.getAttribute('delimiter').replace(/\s+/g, ' ') : '';
    const pairString = (element.attributes.hasOwnProperty('pair') && element.getAttribute('pair').trim()) 
      ? element.getAttribute('pair').replace(/\s+/g, ' ') : '';
    const delimiters = (delimiterString) ? delimiterString.split(' ') : ['\\n', ',', ';'];
    const pairDelimiters = (pairString) ? pairString.split(' ') : [':', '='];
    const overwrite = (element.attributes.hasOwnProperty('overwrite') && element.getAttribute('overwrite')) 
      ? element.getAttribute('overwrite').trim() === 'true' : true;

    // Retrieve inner content of namespace element
    const openIndex = this.parser.findTagPosition(element.content, 0);
    const closedIndex = (openIndex) ? this.parser.findTagPosition(element.content, openIndex[1]) : null;
    if ( closedIndex ) {
      const content = element.content.substring(openIndex[1], closedIndex[0]);

      // Construct a regex pattern for delimiters
      let delimiterPattern = '';
      for ( let i = 0; i < delimiters.length; ++i ) {
        const s = delimiters[i];
        if ( s ) {
          delimiterPattern += `${s}`;
          if ( i < delimiters.length - 1 ) {
            delimiterPattern += '|';
          }
        }
      }
      const delimiterRegex = new RegExp(delimiterPattern, 'g');

      // Split the inner content of the namespace element
      const pairs = content.split(delimiterRegex).filter(pair => pair.trim() !== '');
      for ( let j = 0; j < pairs.length; ++j ) {
        const pair = pairs[j];
        for ( let j = 0; j < pairDelimiters.length; ++j ) {
          const index = pair.indexOf(pairDelimiters[j]);
          if ( index > -1 ) {
            const key = pair.substring(0, index).trim();
            const value = pair.substring(index + 1).trim();
            if ( (overwrite || !namespace.hasOwnProperty(key)) && key && value ) {
              namespace[key] = value;
              j = pairDelimiters.length;
            }
          }
        }
      }

      return namespace;
    }
  }

  /**
   * Retrieves a var element's value from the namespace map
   * @param {ParsedHtmlElement} element 
   * @param {Namespace} namespace
   * @returns {String}
   */
  parseVar(element, namespace) {
    // TODO: Add type checks
    // Retrieve inner content of namespace element
    const openIndex = this.parser.findTagPosition(element.content, 0);
    const closedIndex = (openIndex) ? this.parser.findTagPosition(element.content, openIndex[1]) : null;
    if ( closedIndex ) {
      const content = element.content.substring(openIndex[1], closedIndex[0]).trim();
      if ( namespace.hasOwnProperty(content) ) {
        return namespace[content];
      }
    }
    return '';
  }
}

module.exports = Runesmith;
