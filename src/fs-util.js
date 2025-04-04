'use strict';
const FS = require('fs');
const PATH = require('path');

/**
 * Checks whether path exists or not.
 * @param {String} path
 * @returns {Boolean}
 */
function pathExists(path) {
  path = normalize(path);
  return FS.existsSync(path); 
}

/**
 * Checks if path is a file.
 * @param {String} path
 * @returns {Boolean}
 */
function isFile(path) {
  path = normalize(path);
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
  path = normalize(path);
  return PATH.extname(path);
}

/**
 * Scans path or the current working directory of process for package.json
 * Returns the current path when package.json exists in the directory
 * @returns {String}
 */
function getProjectRoot() {
  let path = normalize(process.cwd());
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

function normalize(path) {
  return path.replace(/\\|\//g, PATH.sep);
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
    const currpath = normalize(paths[i]).trim();
    const levels = currpath.split(PATH.sep);
    // if path starts with a directory or filename or is absolute, reset the path string
    if ( (levels[0] && levels[0] !== '.' && levels[0] !== '..' ) || PATH.isAbsolute(currpath) ) {
      a = [];
    }
    for ( let j = 0; j < levels.length; ++j ) {
      const level = levels[j];
      if ( !a.length ) {
        a.push(level);
      }
      else if ( level === '..' ) {
        a.pop();
      }
      else if ( level && level !== '.' ) {
        a.push(level);
      }
    }
  }
  return a.join(PATH.sep);
}

/**
 * Merge two arrays at the index in which they are sequentially equal
 * @param {String} p1 
 * @param {String} p2
 * @returns {String}
 */
function mergePaths(p1, p2) {
  p1 = normalize(p1);
  p2 = normalize(p2);

  const A = p1.split(PATH.sep);
  const B = [];

  const b = p2.split(PATH.sep);
  // Check the second path for relative path syntaxes
  for ( let i = 0; i < b.length; ++i ) {
    const p = b[i];
    // Move up one level 
    if ( p === '..' ) {
      A.pop();
    }
    // Otherwise push d if it isn't an empty string
    else if ( p ) {
      B.push(p);
    }
  }

  const index = A.indexOf(B[0]);
  // If array1 contains the first element of array 2, begin comparing for sameness starting at index
  if ( index > -1 ) {
    const merged = A.slice(0, index);
    // Once a match is found, all subsequent indexes of both arrays must have matching values until the end of either array is reached
    let indexA = index;
    for ( let i = 0; i < B.length; ++i ) {
      // Stop comparing if at the end of a1 or if the paths are no longer sequentially the same
      if ( indexA >= A.length - 1 || B[i] !== A[indexA] ) {
        break;
      }
      indexA++;
    }

    return PATH.join(merged.join(PATH.sep), B.join(PATH.sep));
  }

  return PATH.join(p1, p2);
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
  return mergePaths(getProjectRoot(), rpath);
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
  if ( !pathExists(path) ) {
    throw new Error(`Invalid Html File: ${path} does not exist.`);
  }
  if ( !isHtmlFile(path) ) {
    throw new Error(`Invalid Html File: ${path} is not an html file.`);
  }

  return FS.readFileSync(path, {'encoding': encoding, 'flag': 'r'});
}

module.exports = {
  pathExists: pathExists,
  isHtmlFile: isHtmlFile,
  getProjectRoot: getProjectRoot,
  mergePaths: mergePaths,
  normalize: normalize,
  resolve: resolve,
  resolveToProjectPath: resolveToProjectPath,
  readHtmlFile: readHtmlFile,
  currdir: currdir
};
