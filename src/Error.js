'use strict';

class RunesmithTypeError extends TypeError {
  constructor(value, type) {
    super(`Expected type ${type}, but received ${value} (type: ${typeof value})`);
    this.type = type;
    this.value = value;
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
    this.tag = tag;
  }
}


module.exports.TypeError = RunesmithTypeError;
module.exports.InvalidTag = InvalidTag;
