'use strict';
const EventEmitter = require('events');
const htmlParser = require('@jikurata/html-parser');
const Path = require('path');
const fsUtil = require('./fs-util.js');
const Errors = require('./Error.js');
const Rune = require('./Rune.js');
const init = Symbol('init');

class Runesmith extends EventEmitter {
  constructor() {
    super();
    Object.defineProperty(this, 'runes', {
      value: {},
      enumerable: true,
      writable: false,
      configurable: false
    });
    Object.defineProperty(this, '_config', {
      value: {
        trimWhitespace: true
      },
      enumerable: true,
      writable: false,
      configurable: false
    });
    this.map = {};
    this.cache = {};
    this[init]();
  }

  [init]() {
    // Namespace rune
    this.rune('namespace', (document) => {
      // Disable trimwhitespace for htmlparser so newlines can be identified
      htmlParser.config({trimWhitespace: false});

      if ( !document.hasOwnProperty('namespace') ) {
        document.namespace = {};
      }
      const namespaceElements = document.getElementsByTagName('namespace');
      
      for ( let i = 0; i < namespaceElements.length; ++i ) {
        const element = namespaceElements[i];
        // Set namespace configurations from element attributes
        const delimiterString = element.hasAttribute('delimiter') ? element.getAttribute('delimiter').trim().replace(/\s+/g, ' ') : '';
        const pairString = element.hasAttribute('pair') ? element.getAttribute('pair').trim().replace(/\s+/g, ' ') : '';

        const delimiters = delimiterString ? delimiterString.split(' ') : ['\\n', ',', ';'];
        const pairDelimiters = pairString ? pairString.split(' ') : [':', '='];
        const overwrite = element.hasAttribute('overwrite') ? element.getAttribute('overwrite').trim() === 'true' : true;
  
        if ( !element.hasOwnProperty('namespace') ) {
          element.namespace = {};
        }
        
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
  
        // Retrieve inner content of namespace element
        const content = element.innerHTML;
        // Split the inner content of the namespace element
        const pairs = content.split(delimiterRegex).filter(pair => pair.trim() !== '');
        for ( let i = 0; i < pairs.length; ++i ) {
          const pair = pairs[i];
          for ( let j = 0; j < pairDelimiters.length; ++j ) {
            const index = pair.indexOf(pairDelimiters[j]);
            if ( index > -1 ) {
              const key = pair.substring(0, index).trim();
              const value = pair.substring(index + 1).trim();
              
              // Update the document namespace
              if ( (overwrite || !document.namespace.hasOwnProperty(key)) && key ) {
                document.namespace[key] = value;
                j = pairDelimiters.length;
              }
            }
          }
        }

        // Remove the namespace element from the document
        document.removeChild(element);
      }

      htmlParser.config(this._config);
    });

    // Var rune
    this.rune('var', (document) => {
      const namespace = document.namespace || {};

      const varElements = document.getElementsByTagName('var');
      for ( let i = 0; i < varElements.length; ++i ) {
        const element = varElements[i];
        const content = element.innerHTML.trim();

        // Replace var element with its namespace value
        if ( namespace.hasOwnProperty(content) ) {
          const parent = element.parent;
          if ( parent ) {
            const replacement = document.createTextNode(namespace[content]);
            parent.replaceChild(element, replacement);
          }
        }
      }
    });

    // Import rune
    this.rune('import', (document) => new Promise((resolve, reject) => {
      if ( !document.fileStack ) {
        document.fileStack = [];
      }
      const currdir = document.currdir || fsUtil.getProjectRoot();
      const namespace = document.namespace || {};
      // Iterate through each import element sequentially
      const importIterator = (queue) => new Promise((resolveItr, rejectItr) => {
        if ( !queue.length ) {
          return resolveItr();
        }

        const importElement = queue.pop();
        const src = importElement.getAttribute('src');
        const filepath = fsUtil.resolveToProjectPath(currdir, src);

        // Check for circular imports
        Errors.CircularCompileError.check(document.fileStack, filepath);

        document.fileStack.push(filepath);
        
        this.compile(filepath, {
          fileStack: document.fileStack,
          currdir: currdir,
          namespace: namespace
        })
        .then(result => {
          let importHtml = result;

          // Convert the imported html into a htmldocument
          const importDocument = htmlParser(importHtml);
          
          // Append the innerHTML of the import tag into any content tags in the import
          const contentElements = importDocument.getElementsByTagName('content');
          for ( let i = 0; i < contentElements.length; ++i ) {
            const element = contentElements[i];
            element.parent.replaceChild(element, importElement.children);
          }
  
          // Replace import tag with its compiled import
          importElement.parent.replaceChild(importElement, importDocument.children);
          
          // Update the queue of import elements
          queue = document.getElementsByTagName('import');
        })
        .then(() => importIterator(queue))
        .then(() => resolveItr())
        .catch(rejectItr);
      });

      // Pass a queue of import elements into the iterator
      importIterator(document.getElementsByTagName('import'))
      .then(() => {
        resolve()
      })
      .catch(reject);
    }));
  }

  /**
   * Create a new rune to add to Runesmith's dictionary
   * @param {String} tag 
   * @param {String|Filepath} file 
   * @param {RuneOptions} options 
   */
  rune(tag, handler) {
    // Throw if tag is invalid
    Errors.TypeError.check(tag, 'string');
    // Throw if handler is invalid
    Errors.TypeError.check(handler, 'function');
    
    tag = tag.trim();

    // Add the rune
    if ( tag ) {
      if ( !this.runes.hasOwnProperty(tag) ) {
        this.runes[tag] = [];
      }
      this.runes[tag].push(new Rune(handler));
    }
  }

  /**
   * Calls all runes associated with the tag
   * @param {String} tag 
   * @param {ParsedHTMLDocument} document
   * @returns {Promise<Void>}
   */
  invoke(tag, document) {
    const runeIterator = (queue) => {
      return new Promise((resolveItr, rejectItr) => {
        if ( !queue.length ) {
          return resolveItr();
        }
        const rune = queue.shift();

        rune.inscribe(document)
        .then(() => runeIterator(queue))
        .then(() => resolveItr())
        .catch(err => rejectItr(err));
      });
    };

    return new Promise((resolve, reject) => {
      if ( this.runes.hasOwnProperty(tag) ) {
        runeIterator([].concat(this.runes[tag]))
        .then(resolve)
        .catch(err => reject(err));
      }
      else {
        resolve();
      }
    });
  }

  /**
   * Parses and compiles the file or string.
   * @param {String|Filepath} file 
   * @returns {Promise<String>}
   */
  compile(file, options = {}) {
    return new Promise((resolve, reject) => {
      // TODO: Add type checks
      const currdir = options.currdir || fsUtil.getProjectRoot();
      const relativePath = Path.relative(currdir, file);
      const namespace = options.namespace || {};
      const filepath = fsUtil.resolveToProjectPath(fsUtil.mergePaths(currdir, file));
      const fileStack = options.fileStack || [filepath];
      let content = '';

      // Retrieve contents of html file
      let html = '';
      if ( this.cache.hasOwnProperty(filepath) ) {
        html = this.cache[filepath];
      }
      else {
        html = fsUtil.readHtmlFile(filepath);
        this.cache[filepath] = html;
      }

      htmlParser.config(this._config);
      const document = htmlParser(html);
      document.fileStack = fileStack;
      document.namespace = namespace;
      document.currdir = fsUtil.currdir(filepath);
      
      // Map out results
      this.map[filepath] = {
        target: filepath,
        files: [],
        namespace: {},
        contentLength: 0,
        created: new Date().toISOString()
      };

      this.parse(document)
      .then(result => {
        content = result
          
        document.fileStack.pop();
    
        this.map[filepath].namespace = document.namespace;
        this.map[filepath].contentLength = content.length;
        resolve(content);
      })
      .catch(err => {
        reject(err);
      });
    })
  }

  /**
   * Passes the document into each rune handler
   * @param {ParsedHTMLDocument} document
   * @returns {Promise<String>}
   */
  parse(document) {
    return new Promise((resolve, reject) => {
      // Pass document through default runes first
      this.invoke('namespace', document)
      .then(() => this.invoke('var', document))
      .then(() => this.invoke('import', document))
      .then(() => {
        const promises = [];
        // Pass the document through any custom runes
        const keys = Object.keys(this.runes);
        for ( let i = 0; i < keys.length; ++i ) {
          const key = keys[i];
          if ( key !== 'namespace' && key !== 'var' && key !== 'import' ) {
            promises.push(this.invoke(key, document));
          }
        }
        return Promise.all(promises);
      })
      .then(() => resolve(document.stringify()))
      .catch(err => reject(err));
    });
  }

  /**
   * Configure Runesmith
   * @param {Object} obj
   * @returns {Object}
   */
  config(obj = {}) {
    const fields = Object.keys(obj);
    for ( let i = 0; i < fields.length; ++i ) {
      const field = fields[i];
      this._config[field] = obj[field];
    }

    return this._config;
  }

  clearMap() {
    this.map = {};
  }

  emptyCache() {
    this.cache = {};
  }
}

module.exports = Runesmith;
