'use strict';
const Taste = require('@jikurata/taste');
const Errors = require('../src/Error.js');
const Runesmith = require('../src/Runesmith.js');

// Compile test
Taste.flavor('Compile a html document')
.describe('Parses a document')
.test(profile => {
  const runesmith = new Runesmith();
  profile.compileResult = runesmith.compile('test/test-example/test-compile.html');
})
.expect('compileResult').toBeTruthy();

Taste.flavor('Circular dependencies')
.describe('Detects circular imports')
.test(profile => {
  const runesmith = new Runesmith();
  try {
    runesmith.compile('test/circular/A.html');
  }
  catch(err) {
    profile.error = err;
  }
})
.expect('error').isInstanceOf(Errors.CircularCompileError)
