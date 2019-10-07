'use strict';
const EventEmitter = require('events');
const htmlParser = require('@jikurata/html-parser');
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
    // TODO: refactor so runes accept a html document as an argument instead of just an element
    // Namespace rune
    this.rune('namespace', (document) => {
      if ( !document.hasOwnProperty('namespace') ) {
        document.namespace = {};
      }
      const namespaceElements = document.getElementsByTagName('namespace');
      
      for ( let i = 0; i < namespaceElements.length; ++i ) {
        const element = namespaceElements[i];
        // Set namespace configurations from element attributes
        const delimiterString = (element.attributes.hasOwnProperty('delimiter') && element.getAttribute('delimiter').trim()) 
          ? element.getAttribute('delimiter').replace(/\s+/g, ' ') : '';
        const pairString = (element.attributes.hasOwnProperty('pair') && element.getAttribute('pair').trim()) 
          ? element.getAttribute('pair').replace(/\s+/g, ' ') : '';
        const delimiters = (delimiterString) ? delimiterString.split(' ') : ['\\n', ',', ';'];
        const pairDelimiters = (pairString) ? pairString.split(' ') : [':', '='];
        const overwrite = (element.attributes.hasOwnProperty('overwrite') && element.getAttribute('overwrite')) 
          ? element.getAttribute('overwrite').trim() === 'true' : true;
  
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
        document.removeChildren(element);
      }
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
            const replacement = document.createTextElement(namespace[content]);
            parent.replaceChild(element, replacement);
          }
        }
      }
    });

    // Import rune
    this.rune('import', (document) => {
      const currdir = document.currdir || fsUtil.getProjectRoot();
      const namespace = document.namespace || {};

      // Parse import elements
      let importElements = document.getElementsByTagName('import');
      while ( importElements.length ) {
        const importElement = importElements.pop();
        const src = importElement.getAttribute('src');
        const filepath = fsUtil.resolveToProjectPath(currdir, src);
        let importHtml = this.compile(filepath,{
          currdir: currdir,
          namespace: namespace
        });
        
        // Convert the imported html into a htmldocument
        const importDocument = htmlParser(importHtml);
        importDocument.config({trimWhitespace: document.trimWhitespace});

        // Append the innerHTML of the import tag into any content tags in the import
        const contentElements = importDocument.getElementsByTagName('content');
        for ( let i = 0; i < contentElements.length; ++i ) {
          const e = contentElements[i];
          importDocument.fragment.replaceChild(e, importElement.children);
          importDocument.deleteElement(e);
        }

        // Replace import tag with its compiled import
        document.fragment.replaceChild(importElement, importDocument.fragment.children);
        document.deleteElement(importElement);
        // Update the array of import elements
        importElements = document.getElementsByTagName('import');
      }
    });
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
   */
  invoke(tag, document) {
    if ( this.runes.hasOwnProperty(tag) ) {
      const runes = this.runes[tag];
      for ( let i = 0; i < runes.length; ++i ) {
        const rune = runes[i];
        rune.inscribe(document);
      }
    }
  }

  /**
   * Parses and compiles the file or string.
   * @param {String|Filepath} file 
   * @returns {String}
   */
  compile(file, options = {}) {
    // TODO: Add type checks
    const currdir = options.currdir || fsUtil.getProjectRoot();
    const namespace = options.namespace || {};
    const filepath = fsUtil.resolveToProjectPath(currdir, file);
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

    const document = htmlParser(html);
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

    content = this.parse(document);

    this.map[filepath].namespace = document.namespace;
    this.map[filepath].contentLength = content.length;

    return content;
  }

  parse(document) {
    // Pass the document through the namespace rune
    this.invoke('namespace', document);
    
    // Pass the document through the var rune
    this.invoke('var', document);

    // Pass the document through the import rune
    this.invoke('import', document);

    // Pass the document through any custom runes
    const keys = Object.keys(this.runes);
    for ( let i = 0; i < keys.length; ++i ) {
      const key = keys[i];
      if ( key !== 'namespace' && key !== 'var' && key !== 'import' ) {
        this.invoke(key, document);
      }
    }

    return document.stringify();
  }
}

module.exports = Runesmith;
