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
        const p = seppath[j];
        // Move up one level 
        if ( p === '..' ) {
          a.pop();
        }
        // Otherwise push d if it isn't an empty string
        else if ( p ) {
          a.push(p);
        }
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
  p1 = PATH.normalize(p1);
  p2 = PATH.normalize(p2);
  
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
    // Once a match is found, all subsequent indexes of both arrays must have matching values until the end of either array is reached
    let sequentialMatch = true;
    for ( let i = 0; i < B.length; ++i ) {
      const indexA = index + i;
      // Stop comparing if at the end of a1
      if ( indexA >= A.length - 1 ) {
        break;
      }
      // Paths are not sequentially the same
      if ( B[i] !== A[indexA] ) {
        sequentialMatch = false;
        break;
      }
    }

    // Merge the matches 
    if ( sequentialMatch ) {
      const merged = A.slice(0, index);
      return PATH.join(merged.join(PATH.sep), B.join(PATH.sep));
    }
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
  resolve: resolve,
  resolveToProjectPath: resolveToProjectPath,
  readHtmlFile: readHtmlFile,
  currdir: currdir
};
