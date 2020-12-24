# Editorjs-parser

editorjs-parser is a NPM package for parsing the output object of [EditorJs](https://github.com/codex-team/editor.js) to HTML.

# Installation

### CDN

- https://cdn.jsdelivr.net/npm/editorjs-parser@1/build/Parser.node.min.js (Node only)
- https://cdn.jsdelivr.net/npm/editorjs-parser@1/build/Parser.browser.min.js (Browser only)

### NPM

Use the package manager [npm](https://www.npmjs.com/) to install editorjs-parser.

```bash
npm install --save editorjs-parser
```

# Usage

To use the package in browser, import Browser verison through CDN to your HTML file and just call `edjsParser` class:

```javascript
const parser = new edjsParser(config, customParsers, embedMarkup);
```

To import the package in Node and Front-end code:

```javascript
const edjsParser = require("editorjs-parser");
const parser = new edjsParser(config, customParsers, embedMarkup);
```

**NOTE:** **Parameters are optional**. If you want to only pass the second parameter, set the first parameter to `undefined`.

To parse all blocks, pass the exact EditorJs' output object:

```javascript
const markup = parser.parse(output);
```

To parse one block, pass a complete block:

```javascript
const markup = parser.parseBlock(block);
```

**NOTE:** HTML markup in code blocks are already sanitized and ready to be send to browser. You don't have to do anything.

**NOTE:** Code blocks are compatible with [highlight.js](https://github.com/highlightjs/highlight.js/)

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
- Simple-image

**NOTE:** It is pointless to use both `image` and `simple-image` block types in the same editor insatnce, but this parser supports both of them and you can use any of them that fulfills your needs.

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
const customParsers = {
    customBlock: function(data, config) {
        // parsing functionality
        // the config arg is user provided config merged with default config
    },
    image: function(data, config): {
        return `<img src="${data.file.url}" alt="${data.caption}" >`;
    }
}

const parser = new edjsParser(undefined, customParsers);
```

**NOTE:** The config arg is user provided config merged with default configuration.

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
    pClass: "paragraph", // used class for paragraph tags
  },
  code: {
    codeBlockClass: "code-block", // used class for code blocks
  },
  embed: {
    useProvidedLength: false,
    // set to true if you want the returned width and height of editorjs to be applied
    // NOTE: sometimes source site overrides the lengths so it does not work 100%
  },
  quote: {
    applyAlignment: false,
    // if set to true blockquote element will have text-align css property set
  },
};
```

### Relative path (images)

To use the relative path, you should return the filename of the uploaded image from your backend, alongside the url (for more info [docs](https://github.com/editor-js/image#backend-response-format-)).

Then include the property name of filename in config like so: (for example the property name of the returned filename is `imageFileName`)

```javascript
const config = {
  image: {
    path: "/img/<imageFileName>";
  }
};

const parser = new edjsParser(config);
```

**NOTE:** Images will have class `img`.

**NOTE:** If the image is streched, the parsed `img` tag will have `img-fullwidth` as class.

**NOTE:** If image is set to have a border, the parsed `img` tag will have `img-border` as class.

**NOTE:** If `withBackground` is set to true, the parsed `img` tag will have `img-bg` as class.

You can style, according to these classes.

### Apply provided lengths (embeds)

If you want the returned width and height of embeded element to be applied, set `useProvidedLength` option to true in config:

```javascript
const config = {
  embed: {
    useProvidedLength: true,
  },
};

const parser = new edjsParser(config);
```

### Custom embed markup (embeds)

If you want to render a custom markup for your embed service, pass it in an object in third argument. For example if you want your own markup to be rendered for Youtube video embed, you got to do this:

```javascript
const parser = new edjsParser(undifined, undifined, {
  youtube: `Your markup in string`,
});
```

You also have access to `data` object. To use that you should put variable names in placeholders, like so:

```javascript
const customEmbeds = {
  youtube: `<iframe src="<%data.embed%>" width="<%data.width%>"><%data.caption%></iframe>`,
};

const parser = new edjsParser(undifined, undifined, customEmbeds);
```

**NOTE:** If you want to have [useProvidedLength](#apply-provided-lengths-embeds) functionality, use `<%data.length%>` instead of `<%data.width%>` and `<%data.height%>` in embed markups.

`<%data.length%>` returns string like this: `width="300" height="500"`

### Qoute Alignment (quotes)

If you need the returned alignment of blockquotes to be set, set `applyAlignment` to true in config:

```javascript
const config = {
  quote: {
    applyAlignment: true;
  }
};

const parser = new edjsParser(config);
```

# Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.

For any issue or feature request, please open an issue.

# License

[MIT](https://choosealicense.com/licenses/mit/)
