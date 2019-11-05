'use strict';
const PATH = require('path');;
const Taste = require('@jikurata/taste');
const fsUtil = require('../src/fs-util.js');

const test = new Promise((resolve, reject) => {
  // FS Utility Tests
  Taste.flavor('Finding project root path')
  .describe('Returns the lowest path from the working path that contains package.json')
  .test(profile => {
    profile.workingDirToProjectRoot = fsUtil.getProjectRoot();
  })
  .expect('workingDirToProjectRoot').toBeTruthy();

  Taste.flavor('Merging filepaths')
  .test(profile => {
    profile.merge1 = fsUtil.mergePaths('this/is/a/', 'path/to/file');
    profile.merge2 = fsUtil.mergePaths('this/is/a/', 'a/path/to/file');
    profile.merge3 = fsUtil.mergePaths('this/is/a/path', 'this/is/also/a/path');
    profile.merge4 = fsUtil.mergePaths('this/is/a/path', '../../also/a/path');
    profile.merge5 = fsUtil.mergePaths('this/is/a/path', '../a/path/too');
    profile.merge6 = fsUtil.mergePaths('this/is/a/path', '/a/path');
  })
  .expect('merge1').toEqual(PATH.normalize('this/is/a/path/to/file'))
  .expect('merge2').toEqual(PATH.normalize('this/is/a/path/to/file'))
  .expect('merge3').toEqual(PATH.normalize('this/is/a/path/this/is/also/a/path'))
  .expect('merge4').toEqual(PATH.normalize('this/is/also/a/path'))
  .expect('merge5').toEqual(PATH.normalize('this/is/a/path/too'))
  .expect('merge6').toEqual(PATH.normalize('/a/path'));

  Taste.flavor('FS file reading')
  .describe('Only read html/htm files')
  .test(profile => {
    try {
      profile.readHtmlFile = fsUtil.readHtmlFile('_test/test-example/template.html');
    }
    catch(err) {
      profile.readHtmlFile = err;
    }
  })
  .expect('readHtmlFile').isTypeOf('string');
  // =====
  resolve();
});

module.exports = test;
