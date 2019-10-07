'use strict';
const Taste = require('@jikurata/taste');
const htmlParser = require('@jikurata/html-parser');
const Runesmith = require('../src/Runesmith.js');

Taste.flavor('Namespace rune')
.describe('Parses namespace elements and saves the namespace in the element')
.test(profile => {
  const runesmith = new Runesmith();
  const rune = runesmith.runes.namespace[0];
  const content = `
    <namespace>
      foo: bar
    </namespace>
  `;
  const document = htmlParser(content);
  rune.inscribe(document);
  profile.foo = document.namespace.foo;
})
.expect('foo').toMatch('bar');

Taste.flavor('Var rune')
.describe('Parses var elements and replaces the element with its namespace value')
.test(profile => {
  const runesmith = new Runesmith();
  const rune = runesmith.runes.var[0];
  const content = `
    <div>
      <var>foo</var>
    </div>
    <var>bar</var>
  `;
  const document = htmlParser(content);
  document.config({trimWhitespace: true});
  document.namespace = {foo: 'bar', bar: 'baz'};
  rune.inscribe(document);
  profile.html = document.stringify();
})
.expect('html').toMatch('<div>bar</div>baz');

Taste.flavor('Import rune')
.describe('Parses import elements and replaces the element with content of its import')
.test(profile => {
  const runesmith = new Runesmith();
  const rune = runesmith.runes.import[0];
  const content = `
    <p>foo</p>
    <import src="test/test-example/test-import.html">
      <span>additional text</span>
    </import>
  `;
  const document = htmlParser(content);
  document.config({trimWhitespace: true});
  rune.inscribe(document);
  profile.html = document.stringify().trim();
})
.expect('html').toMatch('<p>foo</p><p>foobar</p><span>additional text</span>');

Taste.flavor('Import rune')
.describe('Handles nested imports')
.test(profile => {
  const runesmith = new Runesmith();
  const rune = runesmith.runes.import[0];
  const content = `
    <p>foo</p>
    <import src="test/test-example/test-import.html">
      <span>additional text</span>
      <import src="test/test-example/test-import2.html">
        baz
      </import>
    </import>
  `;
  const document = htmlParser(content);
  document.config({trimWhitespace: true});
  rune.inscribe(document);
  profile.html = document.stringify().trim();
})
.expect('html').toMatch('<p>foo</p><p>foobar</p><span>additional text</span><span>bax</span>baz');
