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

const embedMarkups = {
    youtube: `<div class="embed"><iframe class="embed-youtube" frameborder="0" src="<%data.embed%>" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen <%data.length%>></iframe></div>`,

    twitter: `<blockquote class="twitter-tweet" class="embed-twitter" <%data.length%>><a href="<%data.source%>"></a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>`,

    instagram: `<blockquote class="instagram-media" <%data.length%>><a href="<%data.embed%>/captioned"></a></blockquote><script async defer src="//www.instagram.com/embed.js"></script>`,

    codepen: `<div class="embed"><iframe <%data.length%> scrolling="no" src="<%data.embed%>" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe></div>`,

    defaultMarkup: `<div class="embed"><iframe src="<%data.embed%>" <%data.length%> class="embed-unknown" allowfullscreen="true" frameborder="0" ></iframe></div>`,
};

function renderNestedList(items, tag) {
    const lis = items
        .map((item) => {
            const children =
                item.items && item.items.length
                    ? renderNestedList(item.items, tag)
                    : "";
            return `<li>${item.content}${children}</li>`;
        })
        .join("");
    return `<${tag}>${lis}</${tag}>`;
}

function renderNestedChecklist(items) {
    const divs = items
        .map((item) => {
            const checked =
                item.meta && item.meta.checked
                    ? " cdx-checklist__item--checked"
                    : "";
            const children =
                item.items && item.items.length
                    ? renderNestedChecklist(item.items)
                    : "";
            return `<div class="cdx-checklist__item${checked}">${item.content}${children}</div>`;
        })
        .join("");
    return `<div class="cdx-checklist">${divs}</div>`;
}

var defaultParsers = {
    paragraph: function(data, config) {
        return `<p class="${config.paragraph.pClass}"> ${data.text} </p>`;
    },

    header: function(data) {
        return `<h${data.level}>${data.text}</h${data.level}>`;
    },

    list: function(data) {
        const items = data.items || [];

        // legacy format ({style, items: string[]}) — output must stay byte-identical
        if (typeof items[0] === "string" || items.length === 0) {
            const type = data.style === "ordered" ? "ol" : "ul";
            const legacyItems = items.reduce(
                (acc, item) => acc + `<li>${item}</li>`,
                ""
            );
            return `<${type}>${legacyItems}</${type}>`;
        }

        // @editorjs/list v2 ({style, items: [{content, meta, items}]})
        if (data.style === "checklist") {
            return renderNestedChecklist(items);
        }
        return renderNestedList(items, data.style === "ordered" ? "ol" : "ul");
    },

    quote: function(data, config) {
        let alignment = "";
        if (config.quote.applyAlignment) {
            alignment = `style="text-align: ${data.alignment};"`;
        }
        return `<blockquote ${alignment}><p>${data.text}</p><cite>${data.caption}</cite></blockquote>`;
    },

    table: function(data) {
        const rowToTr = (row, tag) =>
            `<tr>${row.reduce((acc, cell) => acc + `<${tag}>${cell}</${tag}>`, "")}</tr>`;
        if (data.withHeadings && data.content.length) {
            const [head, ...body] = data.content;
            return `<table><thead>${rowToTr(head, "th")}</thead><tbody>${body
                .map((row) => rowToTr(row, "td"))
                .join("")}</tbody></table>`;
        }
        const rows = data.content.map((row) => rowToTr(row, "td"));
        return `<table><tbody>${rows.join("")}</tbody></table>`;
  },
  image: function (data, config) {
    const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${
      data.withBorder ? "img-border" : ""
    } ${data.withBackground ? "img-bg" : ""}`;
    const imgClass = config.image.imgClass || "";
    let imageSrc;

    if (data.url) {
      // simple-image was used and the image probably is not uploaded to this server
      // therefore, we use the absolute path provided in data.url
      // so, config.image.path property is useless in this case!
      imageSrc = data.url;
    } else if (config.image.path === "absolute") {
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

  warning: function (data) {
    return `<div class="cdx-warning"><div class="cdx-warning__title">${data.title}</div><div class="cdx-warning__message">${data.message}</div></div>`;
  },

  checklist: function (data) {
    const items = data.items.reduce(
      (acc, item) =>
        acc +
        `<div class="cdx-checklist__item${item.checked ? " cdx-checklist__item--checked" : ""}">${item.text}</div>`,
      ""
    );
    return `<div class="cdx-checklist">${items}</div>`;
  },

  linkTool: function (data) {
    const meta = data.meta || {};
    const image =
      meta.image && meta.image.url
        ? `<div class="link-tool__image" style="background-image: url('${meta.image.url}')"></div>`
        : "";
    const title = meta.title ? `<div class="link-tool__title">${meta.title}</div>` : "";
    const description = meta.description
      ? `<p class="link-tool__description">${meta.description}</p>`
      : "";
    let domain = data.link;
    try {
      domain = new URL(data.link).hostname;
    } catch (err) {
      // keep the raw link as the anchor text
    }
    return `<a class="link-tool__content link-tool__content--rendered" href="${data.link}" target="_blank" rel="nofollow noindex noreferrer">${image}${title}${description}<span class="link-tool__anchor">${domain}</span></a>`;
  },

  attaches: function (data) {
    const file = data.file || {};
    let size = "";
    if (file.size) {
      const isMiB = Math.log10(+file.size) >= 6;
      const value = isMiB ? file.size / 2 ** 20 : file.size / 2 ** 10;
      size = `<span class="cdx-attaches__size">${value.toFixed(1)} ${isMiB ? "MiB" : "KiB"}</span>`;
    }
    const fileIcon = `<div class="cdx-attaches__file-icon"><div class="cdx-attaches__file-icon-background">${
      file.extension ? `<div class="cdx-attaches__file-icon-label">${file.extension}</div>` : ""
    }</div></div>`;
    return `<div class="cdx-attaches cdx-attaches--with-file"><a class="cdx-attaches__download-button" href="${file.url}" target="_blank"></a><div class="cdx-attaches__file-info">${fileIcon}<div class="cdx-attaches__title">${data.title}</div>${size}</div></div>`;
  },

  personality: function (data) {
    return `<div class="cdx-personality"><div class="cdx-personality__photo" style="background-image: url('${data.photo}');"></div><a class="cdx-personality__name" href="${data.link}">${data.name}</a><div class="cdx-personality__description">${data.description}</div></div>`;
  },

  embed: function (data, config) {
    data = { ...data }; // work on a copy — never mutate the caller's block data
    if (config.embed.useProvidedLength) {
      data.length = `width="${data.width}" height="${data.height}"`;
    } else {
      data.length = "";
    }
    const regex = new RegExp(/<%data\.(.+?)%>/, "gm");
    if (config.embedMarkups[data.service]) {
      return config.embedMarkups[data.service].replace(
        regex,
        (match, p1) => data[p1]
      );
    } else {
      return config.embedMarkups["defaultMarkup"].replace(
        regex,
        (match, p1) => data[p1]
      );
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
    constructor(config = {}, customs = {}, embeds = {}) {
        this.config = mergeDeep(defaultConfig, config);
        this.config.embedMarkups = Object.assign({}, embedMarkups, embeds);
        this.parsers = Object.assign({}, defaultParsers, customs);
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
