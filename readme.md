# Runesmith v0.0.5
Parse and compile html files
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

const result = Runesmith(file/path/to/some/file.html); // returns compiled html as a String
```
## Parsing HTML
---
Use special html tags to modify parsing behavior
### Import
Import html files as partials or as templates
```
<import src="a/path/to/file.html"></import>
```
Absolute filepaths are resolved to the project root directory.

When the parser identifies an import tag, it will read the contents of src and then replace the tag with src's content. Furthermore, the children of the import tag will be appended into the src if it contains a content tag:
```
// file.html
<import src="template.html">
    <p>import example</p>
    <import src="import.html"></import>
</import>

// import.html
<p>This is a partial</p>

// template.html
<section>
    <h1>this is a template</h1>
    <content></content>
</section>

>> Runesmith(file.html);
```
Compiles into:
```
<section>
    <h1>this is a template</h1>
    <p>import example</p>
    <p>this is a partial</p>
</section>
```
### Namespace
Create a namespace environment for the parser
```
<namespace>
    foo: bar
    bar: baz
</namespace>
```
namespace elements can have three attributes: delimiter, pair, and overwrite
1. *delimiter*: modifies how namespace interprets the key-value set
    - By default, the parser recognizes newlines, semicolons and commas as delimiters
2. *pair*: modifies how namespace interprets a single key-value pair
    - By default, the parser recognizes colons as the pair separator
3. *overwrite*: modifies namespace overwriting. Namespace scopes are maintains from start to end of compilation. When many namespaces are introduced, this attribute will tell the parser how to interpret conflicting keys
    - By default, the parser will overwrite key-value pairs
```
<namespace delimiter=";" pair="@">
    foo@bar;
    bar@baz;
</namespace>
<namespace ovewrite="false">
    bar: bax
</namespace>
```
Compiles to this map:
```
{
    foo: bar,
    bar: baz
}
```
### Var
Replace var tags with its namespace equivalent
```
<namespace>
    foo: bar
</namespace>
<p>this is <var>foo</var></p>
```
Compiles to:
```
<p>this is bar</p>
```
### Expanding parse behavior
Extend Runesmith by implementing your own parsers:
```
Runesmith.rune((document) => {
    // modify the html document in some way
});
```
A single argument is passed into a rune, an instance of ParsedHTMLDocument. 
ParsedHTMLDocuments can be modified similarly to how the web browser document object can be modified. (https://github.com/jikurata/html-parser to see what is currently supported).
```
// Convert all p elements to span
Runesmith.rune((document) => {
    const elements = document.getElementsByTagName('p');
    for ( let i = 0; i < elements.length; ++i ) {
        elements[i].tagName = 'span';
    }
});
```
To implement asynchronous parsers, simply return a Promise for the rune handler:
```
    Runesmmith.rune((document) => new Promise((resolve, reject) => {
        // async operations here...
    }));
```
The special namespace, var, and import tags all have priority over other parsers, so those tags will be resolved first before any custom parsers are executed.
## Putting it all together
---
```
// main.html
<!DOCTYPE html>
<import src="head.html"></import>
<body>
    <import src="navigation.html"></import>
    <h1><var>title</var></h1>
    <content></content>
</body>

// head.html
<head>
    <meta charset="utf8">
    <title><var>title</var></title>
</head>

// navigation.html
<ul>
    <li><a>home</a></li>
    <li><a>about</a></li>
</ul>

// compile.html
<namespace>
    title: Example
</namespace>
<import src="main.html">
    <section>
        stuff
    </section>
</import>

>> Runesmith(compile.html)
```
Result:
```
    
<!DOCTYPE html>
<head>
    <meta charset="utf8">
    <title>Example</title>
</head>
<body>
    <ul>
        <li><a>home</a></li>
        <li><a>about</a></li>
    </ul>
    <h1>Example</h1>
    <section>
        stuff
    </section>
</body>
```
## Version History
**v0.0.5**
- Fixed misreference for the cache in main module.exports

**v0.0.4**
- Implement async compability for runes
- Expose Runesmith.map to allow users to retrieve stats on the most recent compile
- The file cache can now be emptied by passing {emptyCache: true} as an argument

**v0.0.3**
- Merging paths now account for partial matches

**v0.0.2**
- Absolute filepaths are resolved to the project root directory

**v0.0.1**
- Path resolution between the current directory and current filepath accounts for sequential "sameness" in the filepaths

**v0.0.0**
- TODO: Implement configurations to make Runesmith more flexible
