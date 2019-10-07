# Runesmith v0.0.0
Compile html using templates and imports
---
## Install
---
```
npm install runesmith
```
## Usage
---
```
const Runesmith = require('runesmith');
const filepath = file/path/to/some/file.html
const result = Runesmith(filepath); // returns compiled html as a String
```
Expand Runesmith's vocabulary by adding your own runes
```
Runesmith.rune('foo', (document) => {
    // modify the html document in some way
    const p = document.getElementsTagName('p')[0];
    p.innerHTML = 'foobar';
});
```
## Version History
**v0.0.0**
- TODO: Implement configurations to make Runesmith more flexible
