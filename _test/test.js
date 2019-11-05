const utilTest = require('./util.test.js');
const runeTest = require('./rune.test.js');
const runesmithTest = require('./runesmith.test.js');
const exampleTest = require('./index.test.js');

utilTest
.then(() => runeTest)
.then(() => runesmithTest)
.then(() => exampleTest)
