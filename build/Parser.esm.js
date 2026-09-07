function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var isObject = function isObject(item) {
  return item && _typeof(item) === "object" && !Array.isArray(item);
};

var mergeDeep = function mergeDeep(target, source) {
  var output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(function (key) {
      if (isObject(source[key])) {
        if (!(key in target)) Object.assign(output, _defineProperty({}, key, source[key]));else output[key] = mergeDeep(target[key], source[key]);
      } else {
        Object.assign(output, _defineProperty({}, key, source[key]));
      }
    });
  }

  return output;
};

var sanitizeHtml = function sanitizeHtml(markup) {
  markup = markup.replace(/&/g, "&amp;");
  markup = markup.replace(/</g, "&lt;");
  markup = markup.replace(/>/g, "&gt;");
  return markup;
};

var embedMarkups = {
  youtube: "<div class=\"embed\"><iframe class=\"embed-youtube\" frameborder=\"0\" src=\"<%data.embed%>\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture\" allowfullscreen <%data.length%>></iframe></div>",
  twitter: "<blockquote class=\"twitter-tweet\" class=\"embed-twitter\" <%data.length%>><a href=\"<%data.source%>\"></a></blockquote> <script async src=\"//platform.twitter.com/widgets.js\" charset=\"utf-8\"></script>",
  instagram: "<blockquote class=\"instagram-media\" <%data.length%>><a href=\"<%data.embed%>/captioned\"></a></blockquote><script async defer src=\"//www.instagram.com/embed.js\"></script>",
  codepen: "<div class=\"embed\"><iframe <%data.length%> scrolling=\"no\" src=\"<%data.embed%>\" frameborder=\"no\" loading=\"lazy\" allowtransparency=\"true\" allowfullscreen=\"true\"></iframe></div>",
  defaultMarkup: "<div class=\"embed\"><iframe src=\"<%data.embed%>\" <%data.length%> class=\"embed-unknown\" allowfullscreen=\"true\" frameborder=\"0\" ></iframe></div>"
};
var defaultParsers = {
  paragraph: function paragraph(data, config) {
    return "<p class=\"".concat(config.paragraph.pClass, "\"> ").concat(data.text, " </p>");
  },
  header: function header(data) {
    return "<h".concat(data.level, ">").concat(data.text, "</h").concat(data.level, ">");
  },
  list: function list(data) {
    var type = data.style === "ordered" ? "ol" : "ul";
    var items = data.items.reduce(function (acc, item) {
      return acc + "<li>".concat(item, "</li>");
    }, "");
    return "<".concat(type, ">").concat(items, "</").concat(type, ">");
  },
  quote: function quote(data, config) {
    var alignment = "";

    if (config.quote.applyAlignment) {
      alignment = "style=\"text-align: ".concat(data.alignment, ";\"");
    }

    return "<blockquote ".concat(alignment, "><p>").concat(data.text, "</p><cite>").concat(data.caption, "</cite></blockquote>");
  },
  table: function table(data) {
    var rows = data.content.map(function (row) {
      return "<tr>".concat(row.reduce(function (acc, cell) {
        return acc + "<td>".concat(cell, "</td>");
      }, ""), "</tr>");
    });
    return "<table><tbody>".concat(rows.join(""), "</tbody></table>");
  },
  image: function image(data, config) {
    var imageConditions = "".concat(data.stretched ? "img-fullwidth" : "", " ").concat(data.withBorder ? "img-border" : "", " ").concat(data.withBackground ? "img-bg" : "");
    var imgClass = config.image.imgClass || "";
    var imageSrc;

    if (data.url) {
      // simple-image was used and the image probably is not uploaded to this server
      // therefore, we use the absolute path provided in data.url
      // so, config.image.path property is useless in this case!
      imageSrc = data.url;
    } else if (config.image.path === "absolute") {
      imageSrc = data.file.url;
    } else {
      imageSrc = config.image.path.replace(/<(.+)>/, function (match, p1) {
        return data.file[p1];
      });
    }

    if (config.image.use === "img") {
      return "<img class=\"".concat(imageConditions, " ").concat(imgClass, "\" src=\"").concat(imageSrc, "\" alt=\"").concat(data.caption, "\">");
    } else if (config.image.use === "figure") {
      var figureClass = config.image.figureClass || "";
      var figCapClass = config.image.figCapClass || "";
      return "<figure class=\"".concat(figureClass, "\"><img class=\"").concat(imgClass, " ").concat(imageConditions, "\" src=\"").concat(imageSrc, "\" alt=\"").concat(data.caption, "\"><figcaption class=\"").concat(figCapClass, "\">").concat(data.caption, "</figcaption></figure>");
    }
  },
  code: function code(data, config) {
    var markup = sanitizeHtml(data.code);
    return "<pre><code class=\"".concat(config.code.codeBlockClass, "\">").concat(markup, "</code></pre>");
  },
  raw: function raw(data) {
    return data.html;
  },
  delimiter: function delimiter(data) {
    return "<br />";
  },
  warning: function warning(data) {
    return "<div class=\"cdx-warning\"><div class=\"cdx-warning__title\">".concat(data.title, "</div><div class=\"cdx-warning__message\">").concat(data.message, "</div></div>");
  },
  checklist: function checklist(data) {
    var items = data.items.reduce(function (acc, item) {
      return acc + "<div class=\"cdx-checklist__item".concat(item.checked ? " cdx-checklist__item--checked" : "", "\">").concat(item.text, "</div>");
    }, "");
    return "<div class=\"cdx-checklist\">".concat(items, "</div>");
  },
  linkTool: function linkTool(data) {
    var meta = data.meta || {};
    var image = meta.image && meta.image.url ? "<div class=\"link-tool__image\" style=\"background-image: url('".concat(meta.image.url, "')\"></div>") : "";
    var title = meta.title ? "<div class=\"link-tool__title\">".concat(meta.title, "</div>") : "";
    var description = meta.description ? "<p class=\"link-tool__description\">".concat(meta.description, "</p>") : "";
    var domain = data.link;

    try {
      domain = new URL(data.link).hostname;
    } catch (err) {// keep the raw link as the anchor text
    }

    return "<a class=\"link-tool__content link-tool__content--rendered\" href=\"".concat(data.link, "\" target=\"_blank\" rel=\"nofollow noindex noreferrer\">").concat(image).concat(title).concat(description, "<span class=\"link-tool__anchor\">").concat(domain, "</span></a>");
  },
  attaches: function attaches(data) {
    var file = data.file || {};
    var size = "";

    if (file.size) {
      var isMiB = Math.log10(+file.size) >= 6;
      var value = isMiB ? file.size / Math.pow(2, 20) : file.size / Math.pow(2, 10);
      size = "<span class=\"cdx-attaches__size\">".concat(value.toFixed(1), " ").concat(isMiB ? "MiB" : "KiB", "</span>");
    }

    var fileIcon = "<div class=\"cdx-attaches__file-icon\"><div class=\"cdx-attaches__file-icon-background\">".concat(file.extension ? "<div class=\"cdx-attaches__file-icon-label\">".concat(file.extension, "</div>") : "", "</div></div>");
    return "<div class=\"cdx-attaches cdx-attaches--with-file\"><a class=\"cdx-attaches__download-button\" href=\"".concat(file.url, "\" target=\"_blank\"></a><div class=\"cdx-attaches__file-info\">").concat(fileIcon, "<div class=\"cdx-attaches__title\">").concat(data.title, "</div>").concat(size, "</div></div>");
  },
  personality: function personality(data) {
    return "<div class=\"cdx-personality\"><div class=\"cdx-personality__photo\" style=\"background-image: url('".concat(data.photo, "');\"></div><a class=\"cdx-personality__name\" href=\"").concat(data.link, "\">").concat(data.name, "</a><div class=\"cdx-personality__description\">").concat(data.description, "</div></div>");
  },
  embed: function embed(data, config) {
    data = _objectSpread({}, data); // work on a copy — never mutate the caller's block data

    if (config.embed.useProvidedLength) {
      data.length = "width=\"".concat(data.width, "\" height=\"").concat(data.height, "\"");
    } else {
      data.length = "";
    }

    var regex = new RegExp(/<%data\.(.+?)%>/, "gm");

    if (config.embedMarkups[data.service]) {
      return config.embedMarkups[data.service].replace(regex, function (match, p1) {
        return data[p1];
      });
    } else {
      return config.embedMarkups["defaultMarkup"].replace(regex, function (match, p1) {
        return data[p1];
      });
    }
  }
};
var defaultConfig = {
  image: {
    use: "figure",
    // figure or img (figcaption will be used for caption of figure)
    imgClass: "img",
    figureClass: "fig-img",
    figCapClass: "fig-cap",
    path: "absolute"
  },
  paragraph: {
    pClass: "paragraph"
  },
  code: {
    codeBlockClass: "code-block"
  },
  embed: {
    useProvidedLength: false // set to true if you want the returned width and height of editorjs to be applied
    // NOTE: sometimes source site overrides the lengths so it does not work 100%

  },
  quote: {
    applyAlignment: false // if set to true blockquote element will have text-align css property set

  }
};

var edjsParser = /*#__PURE__*/function () {
  function edjsParser() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var customs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var embeds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, edjsParser);

    this.config = mergeDeep(defaultConfig, config);
    this.config.embedMarkups = Object.assign({}, embedMarkups, embeds);
    this.parsers = Object.assign({}, defaultParsers, customs);
  }

  _createClass(edjsParser, [{
    key: "parse",
    value: function parse(EditorJsObject) {
      var _this = this;

      var html = EditorJsObject.blocks.map(function (block) {
        var markup = _this.parseBlock(block);

        if (markup instanceof Error) {
          return ""; // parser for this kind of block doesn't exist
        }

        return markup;
      });
      return html.join("");
    }
  }, {
    key: "parseBlock",
    value: function parseBlock(block) {
      if (!this.parsers[block.type]) {
        return new Error("".concat(block.type, " is not supported! Define your own custom function."));
      }

      try {
        return this.parsers[block.type](block.data, this.config);
      } catch (err) {
        return err;
      }
    }
  }]);

  return edjsParser;
}();

export default edjsParser;
