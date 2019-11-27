'use strict';
const Taste = require('@jikurata/taste');
const Runesmith = require('../index.js');

// Compile test
Taste('Compile method')
.test('Ensure root export of index invokes compile',
profile => {
  profile.compileResult = Runesmith('_test/test-example/test-compile.html');
})
.expect('compileResult').toBeTruthy();

module.exports = Taste;
