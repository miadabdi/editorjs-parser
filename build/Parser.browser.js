function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var edjsParser = function (extractDomain) {
  'use strict';

  function _interopDefaultLegacy(e) {
    return e && _typeof(e) === 'object' && 'default' in e ? e : {
      'default': e
    };
  }

  var extractDomain__default = /*#__PURE__*/_interopDefaultLegacy(extractDomain);

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
    simpleImage: function simpleImage(data, config) {
      var imageConditions = "".concat(data.stretched ? "img-fullwidth" : "", " ").concat(data.withBorder ? "img-border" : "", " ").concat(data.withBackground ? "img-bg" : "");
      var imgClass = config.simpleImage.imgClass || "";
      var imageSrc;

      if (data.url) {
        // simple-image was used and the image probably is not uploaded to this server
        // therefore, we use the absolute path provided in data.url
        // so, config.image.path property is useless in this case!
        imageSrc = data.url;
      } else if (config.simpleImage.path === "absolute") {
        imageSrc = data.file.url;
      } else {
        imageSrc = config.simpleImage.path.replace(/<(.+)>/, function (match, p1) {
          return data.file[p1];
        });
      }

      if (config.image.use === "img") {
        return "<img class=\"".concat(imageConditions, " ").concat(imgClass, "\" src=\"").concat(imageSrc, "\" alt=\"").concat(data.caption, "\">");
      } else if (config.simpleImage.use === "figure") {
        var figureClass = config.simpleImage.figureClass || "";
        var figCapClass = config.simpleImage.figCapClass || "";
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
    embed: function embed(data, config) {
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
    },
    linkTool: function linkTool(data, config) {
      var _data$meta, _data$meta2, _data$meta3, _data$meta3$title, _data$meta4, _data$meta4$descripti;

      var cfg = config.linkTool; // configurations for linkTool
      // Display meta tags if available (title, description)

      var imageLink = (data === null || data === void 0 ? void 0 : (_data$meta = data.meta) === null || _data$meta === void 0 ? void 0 : _data$meta.image.URL) || (data === null || data === void 0 ? void 0 : (_data$meta2 = data.meta) === null || _data$meta2 === void 0 ? void 0 : _data$meta2.image.url) || '';
      var imageDiv = '';

      if ((imageLink === null || imageLink === void 0 ? void 0 : imageLink.length) > 0) {
        imageDiv = "<div class=\"".concat(cfg.imgWrapperClass, "\">\n        <div class=\"").concat(cfg.imgBgClass, "\" style=\"background-image: url(").concat(imageLink, ")\"></div>\n      </div>");
      }

      return "\n      <a class=\" ".concat(cfg.linkCardClass, "\" href=\"").concat(data.link, "\" target=\"_blank\">\n        <div class=").concat(cfg.linkToolMainClass, ">\n          <div>\n            ").concat((data === null || data === void 0 ? void 0 : (_data$meta3 = data.meta) === null || _data$meta3 === void 0 ? void 0 : (_data$meta3$title = _data$meta3.title) === null || _data$meta3$title === void 0 ? void 0 : _data$meta3$title.length) > 0 ? '<p class=' + cfg.titleClass + '>' + data.meta.title + '</p>' : '', "\n            ").concat((data === null || data === void 0 ? void 0 : (_data$meta4 = data.meta) === null || _data$meta4 === void 0 ? void 0 : (_data$meta4$descripti = _data$meta4.description) === null || _data$meta4$descripti === void 0 ? void 0 : _data$meta4$descripti.length) > 0 ? '<p class=' + cfg.descriptionClass + '>' + data.meta.description + '</p>' : '', "\n            <p class=\"").concat(cfg.linkClass, "\">").concat(extractDomain__default["default"](data.link), "</p>\n          </div>\n        </div>\n        ").concat(imageDiv, "\n      </a>");
    }
  };
  var defaultConfig = {
    simpleImage: {
      use: "figure",
      imgClass: "img-simple",
      figureClass: "fig-img-simple",
      figCapClass: "fig-cap-simple",
      path: "absolute"
    },
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

    },
    linkTool: {
      linkCardClass: 'link-tool-card',
      linkToolMainClass: 'link-tool-main',
      titleClass: 'tl-title',
      descriptionClass: 'tl-description',
      linkClass: 'tl-link',
      imgWrapperClass: 'link-image-wrapper',
      imgBgClass: 'link-img-bg'
    }
  };

  var edjsParser = /*#__PURE__*/function () {
    function edjsParser() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var customs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var embeds = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      _classCallCheck(this, edjsParser);

      this.config = mergeDeep(defaultConfig, config);
      this.config.embedMarkups = Object.assign(embedMarkups, embeds);
      this.parsers = Object.assign(defaultParsers, customs);
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

  return edjsParser;
}(extractDomain);
