'use strict';

class InvalidTag extends TypeError {
  constructor(tag) {
    super(`Received invalid tag ${tag}. A tag must be a truthy string`);
    this.tag = tag;
  }

  /**
   * Throws an InvalidTag Error if tag is not a tag
   * @param {String} tag 
   */
  static isValidTag(tag) {
    if ( typeof tag !== 'string' || !tag.trim() ) {
      throw new InvalidTag(tag);
    }
  }
}


module.exports.InvalidTag = InvalidTag;
