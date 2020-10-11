'use strict';

const isObject = function(item) {
    return item && typeof item === "object" && !Array.isArray(item);
};

const mergeDeep = function(target, source) {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, {
                        [key]: source[key],
                    });
                else output[key] = mergeDeep(target[key], source[key]);
            } else {
                Object.assign(output, {
                    [key]: source[key],
                });
            }
        });
    }
    return output;
};

const sanitizeHtml = function(markup) {
    markup = markup.replace(/&/g, "&amp;");
    markup = markup.replace(/</g, "&lt;");
    markup = markup.replace(/>/g, "&gt;");
    return markup;
};

var defaultParsers = {
    paragraph: function(data, config) {
        return `<p class="${config.paragraph.pClass}"> ${data.text} </p>`;
    },

    header: function(data) {
        return `<h${data.level}>${data.text}</h${data.level}>`;
    },

    list: function(data) {
        const type = data.style === "ordered" ? "ol" : "ul";
        const items = data.items.reduce(
            (acc, item) => acc + `<li>${item}</li>`,
            ""
        );
        return `<${type}>${items}</${type}>`;
    },

    quote: function(data, config) {
        let alignment = "";
        if (config.quote.applyAlignment) {
            alignment = `style="text-align: ${data.alignment};"`;
        }
        return `<blockquote ${alignment}><p>${data.text}</p><cite>${data.caption}</cite></blockquote>`;
    },

    table: function(data) {
            const rows = data.content.map((row) => {
                        return `<tr>${row.reduce(
        (acc, cell) => acc + `<td>${cell}</td>`,
        ""
      )}</tr>`;
    });
    return `<table><tbody>${rows.join("")}</tbody></table>`;
  },

  image: function (data, config) {
    const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${
      data.withBorder ? "img-border" : ""
    }`;
    const imgClass = config.image.imgClass || "";
    let imageSrc;
    if (config.image.path === "absolute") {
      imageSrc = data.file.url;
    } else {
      imageSrc = config.image.path.replace(
        /<(.+)>/,
        (match, p1) => data.file[p1]
      );
    }

    if (config.image.use === "img") {
      return `<img class="${imageConditions} ${imgClass}" src="${imageSrc}" alt="${data.caption}">`;
    } else if (config.image.use === "figure") {
      const figureClass = config.image.figureClass || "";
      const figCapClass = config.image.figCapClass || "";

      return `<figure class="${figureClass}"><img class="${imgClass} ${imageConditions}" src="${imageSrc}" alt="${data.caption}"><figcaption class="${figCapClass}">${data.caption}</figcaption></figure>`;
    }
  },
  code: function (data, config) {
    const markup = sanitizeHtml(data.code);
    return `<pre><code class="${config.code.codeBlockClass}">${markup}</code></pre>`;
  },
  raw: function (data) {
    return data.html;
  },
  delimiter: function (data) {
    return "<br />";
  },

  embed: function (data, config) {
    let length = "";
    if (config.embed.useProvidedLength) {
      length = `width="${data.width}" height="${data.height}"`;
    }
    switch (data.service) {
      case "youtube":
        return `<div class="embed"><iframe class="embed-youtube" frameborder="0" src="${data.embed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ${length}></iframe></div>`;

      case "twitter":
        return `<blockquote class="twitter-tweet" class="embed-twitter" ${length}><a href="${data.source}"></a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>`;

      case "instagram":
        return `<blockquote class="instagram-media" ${length}><a href="${data.embed}/captioned"></a></blockquote><script async defer src="//www.instagram.com/embed.js"></script>`;

      case "codepen":
        return `<div class="embed"><iframe ${length} scrolling="no" src="${data.embed}" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe></div>`;

      default:
        return `<div class="embed"><iframe src="${data.embed}" ${length} class="embed-unknown" allowfullscreen="true" frameborder="0" ></iframe></div>`;
    }
  },
};

var defaultConfig = {
    image: {
        use: "figure", // figure or img (figcaption will be used for caption of figure)
        imgClass: "img",
        figureClass: "fig-img",
        figCapClass: "fig-cap",
        path: "absolute",
    },
    paragraph: {
        pClass: "paragraph",
    },
    code: {
        codeBlockClass: "code-block",
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

class edjsParser {
    constructor(config = {}, customs = {}) {
        this.config = mergeDeep(defaultConfig, config);
        this.parsers = Object.assign(defaultParsers, customs);
    }

    parse(EditorJsObject) {
        const html = EditorJsObject.blocks.map((block) => {
            const markup = this.parseBlock(block);
            if (markup instanceof Error) {
                return ""; // parser for this kind of block doesn't exist
            }
            return markup;
        });
        return html.join("");
    }

    parseBlock(block) {
        if (!this.parsers[block.type]) {
            return new Error(
                `${block.type} is not supported! Define your own custom function.`
            );
        }
        try {
            return this.parsers[block.type](block.data, this.config);
        } catch (err) {
            return err;
        }
    }
}

module.exports = edjsParser;
