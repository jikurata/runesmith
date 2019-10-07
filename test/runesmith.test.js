'use strict';
const Taste = require('@jikurata/taste');
const htmlParser = require('@jikurata/html-parser');
const Runesmith = require('../src/Runesmith.js');
const Rune = require('../src/Rune.js');

Taste.flavor('Expanding the Runesmith vocabulary')
.describe('Declare a new Rune')
.test(profile => {
  const runesmith = new Runesmith();
  profile.test = runesmith.compile('test/test-example/test.html');
})
.expect('test').toBeTruthy();

// Namespace Unit Tests
Taste.flavor('Create a namespace')
.describe('Parses namespace elements')
.test(profile => {
  const runesmith = new Runesmith();
  const content = `
    <namespace>
      foo: bar
      bar: bax
    </namespace>
  `;
  const document = htmlParser(content);
  const namespace = runesmith.parseNamespace(document.getElementsByTagName('namespace')[0]);
  profile.parsedFoo = namespace.foo;
  profile.parsedBar = namespace.bar;
})
.expect('parsedFoo').toEqual('bar')
.expect('parsedBar').toEqual('bax');

Taste.flavor('Defining content delimiter')
.describe('Declare delimiters using the delimiter attribute')
.test(profile => {
  const runesmith = new Runesmith();
  const content = `
    <namespace delimiter="\\*">
      foo: bar*
      bar: bax
    </namespace>
  `;
  const document = htmlParser(content);
  const namespace = runesmith.parseNamespace(document.getElementsByTagName('namespace')[0]);
  profile.parsedFoo = namespace.foo;
  profile.parsedBar = namespace.bar;
})
.expect('parsedFoo').toEqual('bar')
.expect('parsedBar').toEqual('bax');

Taste.flavor('Defining key-value delimiter')
.describe('Declare delimiters using the pair attribute')
.test(profile => {
  const runesmith = new Runesmith();
  const content = `
    <namespace pair="@">
      foo@bar
      bar@bax
    </namespace>
  `;
  const document = htmlParser(content);
  const namespace = runesmith.parseNamespace(document.getElementsByTagName('namespace')[0]);
  profile.parsedFoo = namespace.foo;
  profile.parsedBar = namespace.bar;
})
.expect('parsedFoo').toEqual('bar')
.expect('parsedBar').toEqual('bax');


Taste.flavor('Defining namespace overwriting')
.describe('Declare overwriting state with the overwrite attribute')
.test(profile => {
  const runesmith = new Runesmith();
  const content = `
    <namespace overwrite="false">
      foo: bar
      bar: bax
      bar: baz
    </namespace>
  `;
  const document = htmlParser(content);
  const namespace = runesmith.parseNamespace(document.getElementsByTagName('namespace')[0]);
  profile.parsedBar = namespace.bar;
})
.expect('parsedBar').toEqual('bax');

// Var element unit tests
Taste.flavor('Parses var elements')
.describe('Retrieve a var element value from the namespace')
.test(profile => {
  const runesmith = new Runesmith();
  const content = `
    <namespace>
      foo: bar
    </namespace>
    <var>foo</var>
  `;
  const document = htmlParser(content);
  const namespace = runesmith.parseNamespace(document.getElementsByTagName('namespace')[0]);
  
  profile.parsedVar = runesmith.parseVar(document.getElementsByTagName('var')[0], namespace);
})
.expect('parsedVar').toEqual('bar');

// import element unit tests
Taste.flavor('Parses import elements')
.describe('Compiles an import filepath and appends it to the original content')
.test(profile => {
  const runesmith = new Runesmith();
  const content = `
    <import src="test/test-example/test-import.html"></import>
  `;
  const document = htmlParser(content);
  const importContent = runesmith.parseImport(document.getElementsByTagName('import')[0]);
  const importDocument = htmlParser(importContent);
  profile.parsedImportP = importDocument.getElementsByTagName('p');
  profile.parsedImportElement = importDocument.getElementsByTagName('content');
})
.expect('parsedImportP').toBeTruthy()
.expect('parsedImportElement').toBeTruthy();

Taste.flavor('Appending to content tag')
.describe('Appends additional content into an imported content tag')
.test(profile => {
  const runesmith = new Runesmith();
  const content = `
    <import src="test/test-example/test-import.html">
      <span>this is imported at content</span>
    </import>
  `;
  const document = htmlParser(content);
  const importContent = runesmith.parseImport(document.getElementsByTagName('import')[0]);
  const importDocument = htmlParser(importContent);
  profile.parsedImportContent = importDocument.getElementsByTagName('span');
})
.expect('parsedImportContent').toBeTruthy();


// Compile test
Taste.flavor('Compile a html document')
.describe('Parses a document')
.test(profile => {
  const runesmith = new Runesmith();
  profile.compileResult = runesmith.compile('test/test-example/test-compile.html');
})
.expect('compileResult').toBeTruthy();
