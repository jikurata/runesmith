'use strict';

class RunesmithTypeError extends TypeError {
  constructor(value, type) {
    super(`Expected type ${type}, but received ${value} (type: ${typeof value})`);
  }

  static check(value, type) {
    if ( typeof value !== type ) {
      throw new RunesmithTypeError(value, type);
    }
  }
}

class InvalidTag extends RunesmithTypeError {
  constructor(tag) {
    super(tag, 'string');
  }
}

/**
 * @param {String} filepath
 * @param {Array[String]} fileStack
 */
class CircularCompileError extends Error {
  constructor(stack, file) {
    super(`Detected circular compilation for ${file}:\nStack: [${stack}]`);
  }

  static check(stack, file) {
    if ( stack.indexOf(file) > -1 ) {
      throw new CircularCompileError(stack, file);
    }
  }
}

module.exports.TypeError = RunesmithTypeError;
module.exports.InvalidTag = InvalidTag;
module.exports.CircularCompileError = CircularCompileError;
