'use strict';
const Taste = require('@jikurata/taste');
const Runesmith = require('../index.js');

const test = new Promise((resolve, reject) => {
  // Compile test
  Taste.flavor('Compile method')
  .describe('Ensure index invokes compile')
  .test(profile => {
    profile.compileResult = Runesmith('_test/test-example/test-compile.html');
    resolve();
  })
  .expect('compileResult').toBeTruthy();
});

module.exports = test;
