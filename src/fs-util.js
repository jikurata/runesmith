'use strict';
const FS = require('fs');
const PATH = require('path');

/**
 * Checks whether path exists or not.
 * @param {String} path
 * @returns {Boolean}
 */
function pathExists(path) {
  path = PATH.normalize(path);
  return FS.existsSync(path); 
}

/**
 * Checks if path is a file.
 * @param {String} path
 * @returns {Boolean}
 */
function isFile(path) {
  path = PATH.normalize(path);
  return pathExists(path) && FS.statSync(path).isFile();
}
  
/**
 * Checks if path is a html file.
 * @param {String} path
 * @returns {Boolean}
 */
function isHtmlFile(path) {
  const type = getFileType(path);
  return ( type === '.html' || type === '.htm' );
}

function getFileType(path) {
  path = PATH.normalize(path);
  return PATH.extname(path);
}

/**
 * Scans path or the current working directory of process for package.json
 * Returns the current path when package.json exists in the directory
 * @returns {String}
 */
function getProjectRoot() {
  let path = PATH.normalize(process.cwd());
  if ( isFile(path) ) {
    path = PATH.dirname(path);
  }
  if ( pathExists(path) ) {
    const a = path.split(PATH.sep)
    while (a.length) {
      const dirpath = a.join(PATH.sep);
      const content = FS.readdirSync(dirpath);
      for ( let i = 0; i < content.length; ++i ) {
        // If the directory contains package.json return the directory
        if ( content[i].match('package.json') ) {
          return dirpath;
        }
      }
      a.pop();
    }
  }
  return null;
}

/**
 * Resolves multiple paths into a single path
 * Any succeeding absolute paths will overwrite the resulting path
 * dirname path before parsing
 * @param  {...String} paths 
 * @returns {String}
 */
function resolve(...paths) {
  let a = [];
  for ( let i = 0; i < paths.length; ++i ) {
    const currpath = PATH.normalize(paths[i]);
    const seppath = currpath.split(PATH.sep);
    // if the current path is an absolute path, replace the path array
    if ( PATH.isAbsolute(currpath) ) {
      a = seppath;
    }
    // else if the path array is empty, append the current path
    else if ( !a.length ) {
      a = a.concat(seppath);
    }
    // Otherwise parse each individual path descriptor
    else { 
      for ( let j = 0; j < seppath.length; ++j ) {
        const d = seppath[j];
        // Move up one level 
        if ( d === '..' ) {
          a.pop();
        }
        // Otherwise push d if it isn't an empty string
        else if ( d ) {
          a.push(d);
        }
      }
    }
  }
  return a.join(PATH.sep);
}

/**
 * Resolves a set of paths with the project's root path
 * @param  {...String} paths
 * @returns {String}
 */
function resolveToProjectPath(...paths) {
  const rpath = resolve(...paths);
  if ( PATH.isAbsolute(rpath) ) {
    return rpath;
  }
  return resolve(getProjectRoot(), rpath);
}

function currdir(path) {
  return resolve(path, '../');
}
  
/**
 * Reads contents of html file
 * Returns contents as a string
 * Throws when path is not a html file
 * @param {String} path 
 * @param {String} encoding (Default: 'utf8')
 * @returns {String}
 */
function readHtmlFile(path, encoding = 'utf8') {
  if ( !pathExists(path) || !isHtmlFile(path) ) {
    throw new Error(`${path} is not a valid html file path`);
  }

  return FS.readFileSync(path, {'encoding': encoding, 'flag': 'r'});
}

module.exports = {
  pathExists: pathExists,
  isHtmlFile: isHtmlFile,
  getProjectRoot: getProjectRoot,
  resolve: resolve,
  resolveToProjectPath: resolveToProjectPath,
  readHtmlFile: readHtmlFile,
  currdir: currdir
};
