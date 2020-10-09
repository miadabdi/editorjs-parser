# Editorjs-parser

editorjs-parser is a NPM package for parsing the output object of [EditorJs](https://github.com/codex-team/editor.js) to HTML.

# Installation

Use the package manager [npm](https://www.npmjs.com/) to install editorjs-parser.

```bash
npm install --save editorjs-parser
```

# Usage

To import the package in browser:

```javascript
import edjsParser from "editorjs-parser";
```

To import the package in Node:

```javascript
const edjsParser = require("editorjs-parser");
const parser = new edjsParser(config, customParsers);
```

**NOTE:** Parameters are optional. If you want to only pass the second parameter, set the first parameter to `undefined`.

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

## Custom or overriding parser methods

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
    customBlock: function(data, config) {
        // parsing functionality
        // the config arg is user provided config merged with default config
    },
    image: function(data, config): {
        return `<img src="${data.file.url}" alt="${data.caption}" >`;
    }
}
```

**NOTE:** the config arg is user provided config merged with default configuration.

## Configuration

This is the default configuration. You can override any of these properties by passing a config object.

```javascript
{
    image: {
        use: "figure",
        // use figure or img tag for images (figcaption will be used for caption of figure)
        // if you use figure, caption will be visible
        imgClass: "img", // used class for img tags
        figureClass: "fig-img", // used class for figure tags
        figCapClass: "fig-cap", // used class for figcaption tags
        path: "absolute",
        // if absolute is passed, the url property which is the absolute path to the image will be used
        // otherwise pass a relative path with the filename property in <> like so: '/img/<fileName>'
    },
    paragraph: {
        pClass: 'paragraph' // used class for paragraph tags
    },
    code: {
        codeBlockClass: 'code-block' // used class for code blocks
    }
};
```

To use the relative path, you should return the filename of the uploaded image from your backend, alongside the url (for more info [docs](https://github.com/editor-js/image#backend-response-format-)).

Then include the property name of filename in config like so: (for example the property name of the returned filename is `imageFileName`)

```javascript
{
  image: {
    path: "/img/<imageFileName>";
  }
}
```

**NOTE:** Images will have class `img`.

**NOTE:** If the image is streched, the parsed `img` tag will have `img-fullwidth` as class.

**NOTE:** If image is set to have a border, the parsed `img` tag will have `img-border` as class.

You can style, according to these classes.

# Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

For any issue or feature request, please open an issue.

# License

[MIT](https://choosealicense.com/licenses/mit/)
