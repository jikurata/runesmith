'use strict';
const Taste = require('@jikurata/taste');
const Errors = require('../src/Error.js');
const Runesmith = require('../src/Runesmith.js');

// Compile test
Taste('Compile a html document')
.test(profile => {
  const runesmith = new Runesmith();
  profile.compileResult = runesmith.compile('_test/test-example/test-compile.html');
})
.expect('compileResult').toBeTruthy();

Taste('Detect circular dependencies')
.test(profile => {
  const runesmith = new Runesmith();
  runesmith.compile('_test/circular/A.html')
  .then(() => profile.error = null)
  .catch(err => profile.error = err);
})
.expect('error').toBeInstanceOf(Errors.CircularCompileError)

module.exports = Taste;
