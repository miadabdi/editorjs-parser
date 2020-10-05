# Editorjs-parser

editorjs-parser is a NPM package for parsing the output object of [EditorJs](https://github.com/codex-team/editor.js) to HTML.

# Installation

Use the package manager [npm](https://www.npmjs.com/) to install editorjs-parser.

```bash
npm install --save editorjs-parser
```

# Usage

To import the package:

```javascript
const edjsParser = require("editorjs-parser");
const parser = new edjsParser(config, customParsers);
```

To parse all blocks, pass the exact EditorJs' output object:

```javascript
const markup = parser.parse(output);
```

To parse one block, pass a complete block:

```javascript
const markup = parser.parseBlock(block);
```

## Supported blocks

- Paragraph
- Header
- Table
- Raw
- Delimiter
- Code
- Quote
- List
- Embed
- Image

## Custom or overriding parser method

If you have a custom block like so:

```javascript
{
   type: "customBlock",
   data: {
       // Your data
   }
}
```

You can pass an object of custom parsers or override existing parsers of supported blocks as the second argument, like so:

```javascript
{
    customBlock: function(data) {
        // parsing functionality
    },
    image: function(data): {
        return `<img src="${data.file.url}" alt="${data.caption}" >`;
    }
}
```

# Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

For any issue or feature request, please open an issue.

# License

[MIT](https://choosealicense.com/licenses/mit/)
