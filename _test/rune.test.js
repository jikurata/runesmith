'use strict';
const Taste = require('@jikurata/taste');
const htmlParser = require('@jikurata/html-parser');
const Runesmith = require('../src/Runesmith.js');

const test = new Promise((resolve, reject) => {
  Taste.flavor('Expanding the Runesmith vocabulary')
  .describe('Declare a new Rune')
  .test(profile => {
    const runesmith = new Runesmith();
    runesmith.rune('p', (document) => {});
    profile.rune = runesmith.runes.p.length;
  })
  .expect('rune').toEqual(1);

  Taste.flavor('Namespace rune')
  .describe('Parses namespace elements and saves the namespace in the document')
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

  Taste.flavor('Defining content delimiter')
  .describe('Declare delimiters using the delimiter attribute')
  .test(profile => {
    const runesmith = new Runesmith();
    const rune = runesmith.runes.namespace[0];
    const content = `
      <namespace delimiter="\\*">
        foo: bar*
        bar: bax
      </namespace>
    `;
    const document = htmlParser(content);
    rune.inscribe(document);
    profile.parsedFoo = document.namespace.foo;
    profile.parsedBar = document.namespace.bar;
  })
  .expect('parsedFoo').toEqual('bar')
  .expect('parsedBar').toEqual('bax');

  Taste.flavor('Defining key-value delimiter')
  .describe('Declare delimiters using the pair attribute')
  .test(profile => {
    const runesmith = new Runesmith();
    const rune = runesmith.runes.namespace[0];
    const content = `
      <namespace pair="@">
        foo@bar
        bar@bax
      </namespace>
    `;
    const document = htmlParser(content);
    rune.inscribe(document);
    profile.parsedFoo = document.namespace.foo;
    profile.parsedBar = document.namespace.bar;
  })
  .expect('parsedFoo').toEqual('bar')
  .expect('parsedBar').toEqual('bax');


  Taste.flavor('Defining namespace overwriting')
  .describe('Declare overwriting state with the overwrite attribute')
  .test(profile => {
    const runesmith = new Runesmith();
    const rune = runesmith.runes.namespace[0];
    const content = `
      <namespace overwrite="false">
        foo: bar
        bar: bax
        bar: baz
      </namespace>
    `;
    const document = htmlParser(content);
    rune.inscribe(document);
    profile.parsedBar = document.namespace.bar;
  })
  .expect('parsedBar').toEqual('bax');

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
  .expect('html').toEqual('<div>bar</div>baz');

  Taste.flavor('Import rune')
  .describe('Parses import elements and replaces the element with content of its import')
  .test(profile => {
    const runesmith = new Runesmith();
    const rune = runesmith.runes.import[0];
    const content = `
      <p>foo</p>
      <import src="_test/test-example/test-import.html">
        <span>additional text</span>
      </import>
    `;
    const document = htmlParser(content);
    document.config({trimWhitespace: true});
    rune.inscribe(document);
    profile.html = document.stringify().trim();
  })
  .expect('html').toEqual('<p>foo</p><p>foobar</p><span>additional text</span>');

  Taste.flavor('Import rune')
  .describe('Handles nested imports')
  .test(profile => {
    const runesmith = new Runesmith();
    const rune = runesmith.runes.import[0];
    const content = `
      <p>foo</p>
      <import src="_test/test-example/test-import.html">
        <span>additional text</span>
        <import src="_test/test-example/test-import2.html">
          baz
        </import>
      </import>
    `;
    const document = htmlParser(content);
    document.config({trimWhitespace: true});
    rune.inscribe(document);
    profile.html = document.stringify().trim();
  })
  .expect('html').toEqual('<p>foo</p><p>foobar</p><span>additional text</span><span>bax</span>baz');
  resolve();
});

module.exports = test;
