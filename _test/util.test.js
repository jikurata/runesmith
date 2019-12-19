'use strict';
const PATH = require('path');;
const Taste = require('@jikurata/taste');
const fsUtil = require('../src/fs-util.js');

// FS Utility Tests
Taste('Finding project root path')
.test('Returns the lowest path from the working path that contains package.json',
profile => {
  profile.workingDirToProjectRoot = fsUtil.getProjectRoot();
})
.expect('workingDirToProjectRoot').toBeTruthy();

Taste('Path resolution')
.test(profile => {
  profile.resolve1 = fsUtil.resolve('a/b/c', 'd/e/f');
  profile.resolve2 = fsUtil.resolve('a/b/c', '/d/e/f');
  profile.resolve3 = fsUtil.resolve('a/b/c', './d/e/f');
  profile.resolve4 = fsUtil.resolve('a/b/c', '../../d/e/f');
  profile.resolve5 = fsUtil.resolve('../b/c', './d/e/f');
  profile.resolve6 = fsUtil.resolve('./a/b/c', './d/e/f');
})
.expect('resolve1').toEqual(fsUtil.normalize('d/e/f'))
.expect('resolve2').toEqual(fsUtil.normalize('/d/e/f'))
.expect('resolve3').toEqual(fsUtil.normalize('a/b/c/d/e/f'))
.expect('resolve4').toEqual(fsUtil.normalize('a/d/e/f'))
.expect('resolve5').toEqual(fsUtil.normalize('../b/c/d/e/f'))
.expect('resolve6').toEqual(fsUtil.normalize('./a/b/c/d/e/f'))


Taste('Merging filepaths')
.test(profile => {
  profile.merge1 = fsUtil.mergePaths('this/is/a/', 'path/to/file');
  profile.merge2 = fsUtil.mergePaths('this/is/a/', 'a/path/to/file');
  profile.merge3 = fsUtil.mergePaths('this/is/a/path', 'this/is/also/a/path');
  profile.merge4 = fsUtil.mergePaths('this/is/a/path', '../../also/a/path');
  profile.merge5 = fsUtil.mergePaths('this/is/a/path', '../a/path/too');
})
.expect('merge1').toEqual(fsUtil.normalize('this/is/a/path/to/file'))
.expect('merge2').toEqual(fsUtil.normalize('this/is/a/path/to/file'))
.expect('merge3').toEqual(fsUtil.normalize('this/is/also/a/path'))
.expect('merge4').toEqual(fsUtil.normalize('this/is/also/a/path'))
.expect('merge5').toEqual(fsUtil.normalize('this/is/a/path/too'));

const root = fsUtil.getProjectRoot();
Taste('Resolving to project root directory')
.test(profile => {
  profile.root1 = fsUtil.resolveToProjectPath('this/is/a/path');
  profile.root2 = fsUtil.resolveToProjectPath('this/is/a/path', '/absolute/path');
  profile.root3 = fsUtil.resolveToProjectPath(root, '/path');
})
.expect('root1').toEqual(fsUtil.normalize(PATH.join(root, 'this/is/a/path')))
.expect('root2').toEqual(fsUtil.normalize(PATH.join(root, 'absolute/path')))
.expect('root3').toEqual(fsUtil.normalize(PATH.join(root, 'path')));

Taste('FS file reading')
.test('Only read html/htm files',
profile => {
  try {
    profile.readHtmlFile = fsUtil.readHtmlFile('_test/test-example/template.html');
  }
  catch(err) {
    profile.readHtmlFile = err;
  }
})
.expect('readHtmlFile').toBeTypeOf('string');

module.exports = Taste;
