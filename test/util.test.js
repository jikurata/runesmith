'use strict';
const PATH = require('path');;
const Taste = require('@jikurata/taste');
const fsUtil = require('../src/fs-util.js');

// FS Utility Tests
  Taste.flavor('Finding project root path')
  .describe('Returns the lowest path from the working path that contains package.json')
  .test(profile => {
    profile.workingDirToProjectRoot = fsUtil.getProjectRoot();
  })
  .expect('workingDirToProjectRoot').toBeTruthy()

  Taste.flavor('Resolving filepaths')
  .describe('Combines multiple paths to form a single path')
  .test(profile => {
    profile.resolveAbsoluteAndRelative = fsUtil.resolve('/src/asset', 'img/logo.png');
    profile.resolveRelativeAndRelative = fsUtil.resolve('./src/asset', 'img/logo.png');
    profile.resolveAbsoluteAndAbsolute = fsUtil.resolve('/src/absolute/path', '/overwrite/absolute/path');
  })
  .expect('resolveAbsoluteAndRelative').toEqual(PATH.normalize('/src/asset/img/logo.png'))
  .expect('resolveRelativeAndRelative').toEqual(PATH.normalize('src/asset/img/logo.png'))
  .expect('resolveAbsoluteAndAbsolute').toEqual(PATH.normalize('/overwrite/absolute/path'));

  Taste.flavor('FS file reading')
  .describe('Only read html/htm files')
  .test(profile => {
    try {
      profile.readHtmlFile = fsUtil.readHtmlFile('test/test-example/test.html');
    }
    catch(err) {
      profile.readHtmlFile = err;
    }
  })
  .expect('readHtmlFile').isTypeOf('string');
// =====
