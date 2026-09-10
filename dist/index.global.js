"use strict";
var edjsParser = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });

  // src/utilities.ts
  var isObject = function(item) {
    return !!item && typeof item === "object" && !Array.isArray(item);
  };
  var mergeDeep = function(target, source) {
    const output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (isObject(source[key])) {
          if (!(key in target)) output[key] = source[key];
          else output[key] = mergeDeep(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      });
    }
    return output;
  };
  var sanitizeHtml = function(markup) {
    return markup.replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]
    );
  };
  var embedMarkups = {
    youtube: `<div class="embed"><iframe class="embed-youtube" frameborder="0" src="<%data.embed%>" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen <%data.length%>></iframe></div>`,
    twitter: `<blockquote class="twitter-tweet" class="embed-twitter" <%data.length%>><a href="<%data.source%>"></a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>`,
    instagram: `<blockquote class="instagram-media" <%data.length%>><a href="<%data.embed%>/captioned"></a></blockquote><script async defer src="//www.instagram.com/embed.js"></script>`,
    codepen: `<div class="embed"><iframe <%data.length%> scrolling="no" src="<%data.embed%>" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe></div>`,
    defaultMarkup: `<div class="embed"><iframe src="<%data.embed%>" <%data.length%> class="embed-unknown" allowfullscreen="true" frameborder="0" ></iframe></div>`
  };

  // src/parsers.ts
  function renderNestedList(items, tag) {
    const lis = items.map((item) => {
      const children = item.items && item.items.length ? renderNestedList(item.items, tag) : "";
      return `<li>${item.content}${children}</li>`;
    }).join("");
    return `<${tag}>${lis}</${tag}>`;
  }
  function renderNestedChecklist(items) {
    const divs = items.map((item) => {
      const checked = item.meta && item.meta.checked ? " cdx-checklist__item--checked" : "";
      const children = item.items && item.items.length ? renderNestedChecklist(item.items) : "";
      return `<div class="cdx-checklist__item${checked}">${item.content}${children}</div>`;
    }).join("");
    return `<div class="cdx-checklist">${divs}</div>`;
  }
  var parsers = {
    paragraph: function(data, config) {
      return `<p class="${config.paragraph.pClass}">${data.text}</p>`;
    },
    header: function(data) {
      const level = Math.min(6, Math.max(1, parseInt(String(data.level), 10) || 1));
      return `<h${level}>${data.text}</h${level}>`;
    },
    list: function(data) {
      const items = data.items || [];
      if (typeof items[0] === "string" || items.length === 0) {
        const type = data.style === "ordered" ? "ol" : "ul";
        const legacyItems = items.reduce(
          (acc, item) => acc + `<li>${item}</li>`,
          ""
        );
        return `<${type}>${legacyItems}</${type}>`;
      }
      if (data.style === "checklist") {
        return renderNestedChecklist(items);
      }
      return renderNestedList(
        items,
        data.style === "ordered" ? "ol" : "ul"
      );
    },
    quote: function(data, config) {
      let alignment = "";
      if (config.quote.applyAlignment) {
        alignment = `style="text-align: ${data.alignment};"`;
      }
      return `<blockquote ${alignment}><p>${data.text}</p><cite>${data.caption}</cite></blockquote>`;
    },
    table: function(data) {
      const rowToTr = (row, tag) => (
        // editor.js saves empty cells as null — render them as empty, not "null"
        `<tr>${row.reduce((acc, cell) => acc + `<${tag}>${cell != null ? cell : ""}</${tag}>`, "")}</tr>`
      );
      if (data.withHeadings && data.content.length) {
        const [head, ...body] = data.content;
        return `<table><thead>${rowToTr(head, "th")}</thead><tbody>${body.map((row) => rowToTr(row, "td")).join("")}</tbody></table>`;
      }
      const rows = data.content.map((row) => rowToTr(row, "td"));
      return `<table><tbody>${rows.join("")}</tbody></table>`;
    },
    image: function(data, config) {
      const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${data.withBorder ? "img-border" : ""} ${data.withBackground ? "img-bg" : ""}`;
      const imgClass = config.image.imgClass || "";
      let imageSrc;
      if (data.url) {
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
        return `<img class="${imageConditions} ${imgClass}" src="${imageSrc}" alt="${data.caption || ""}">`;
      } else if (config.image.use === "figure") {
        const figureClass = config.image.figureClass || "";
        const figCapClass = config.image.figCapClass || "";
        const figcaption = data.caption ? `<figcaption class="${figCapClass}">${data.caption}</figcaption>` : "";
        return `<figure class="${figureClass}"><img class="${imgClass} ${imageConditions}" src="${imageSrc}" alt="${data.caption || ""}">${figcaption}</figure>`;
      }
      return void 0;
    },
    code: function(data, config) {
      const markup = sanitizeHtml(data.code);
      return `<pre><code class="${config.code.codeBlockClass}">${markup}</code></pre>`;
    },
    raw: function(data) {
      return data.html;
    },
    delimiter: function(data, config) {
      return `<${config.delimiter.tag} />`;
    },
    warning: function(data) {
      return `<div class="cdx-warning"><div class="cdx-warning__title">${data.title}</div><div class="cdx-warning__message">${data.message}</div></div>`;
    },
    checklist: function(data) {
      const items = data.items.reduce(
        (acc, item) => acc + `<div class="cdx-checklist__item${item.checked ? " cdx-checklist__item--checked" : ""}">${item.text}</div>`,
        ""
      );
      return `<div class="cdx-checklist">${items}</div>`;
    },
    linkTool: function(data) {
      const meta = data.meta || {};
      const image = meta.image && meta.image.url ? `<div class="link-tool__image" style="background-image: url('${meta.image.url}')"></div>` : "";
      const title = meta.title ? `<div class="link-tool__title">${meta.title}</div>` : "";
      const description = meta.description ? `<p class="link-tool__description">${meta.description}</p>` : "";
      let domain = data.link;
      try {
        domain = new URL(data.link).hostname;
      } catch (err) {
      }
      return `<a class="link-tool__content link-tool__content--rendered" href="${data.link}" target="_blank" rel="nofollow noindex noreferrer">${image}${title}${description}<span class="link-tool__anchor">${domain}</span></a>`;
    },
    attaches: function(data) {
      const file = data.file || {};
      let size = "";
      if (file.size) {
        const isMiB = Math.log10(+file.size) >= 6;
        const value = isMiB ? file.size / 2 ** 20 : file.size / 2 ** 10;
        size = `<span class="cdx-attaches__size">${value.toFixed(1)} ${isMiB ? "MiB" : "KiB"}</span>`;
      }
      const fileIcon = `<div class="cdx-attaches__file-icon"><div class="cdx-attaches__file-icon-background">${file.extension ? `<div class="cdx-attaches__file-icon-label">${file.extension}</div>` : ""}</div></div>`;
      return `<div class="cdx-attaches cdx-attaches--with-file"><a class="cdx-attaches__download-button" href="${file.url}" target="_blank"></a><div class="cdx-attaches__file-info">${fileIcon}<div class="cdx-attaches__title">${data.title}</div>${size}</div></div>`;
    },
    personality: function(data) {
      return `<div class="cdx-personality"><div class="cdx-personality__photo" style="background-image: url('${data.photo}');"></div><a class="cdx-personality__name" href="${data.link}">${data.name}</a><div class="cdx-personality__description">${data.description}</div></div>`;
    },
    // editorjs-alert — classes mirror the tool's own render() output;
    // align only exists since the tool's v1.1, so it is optional
    alert: function(data) {
      const align = data.align ? ` cdx-alert-align-${data.align}` : "";
      return `<div class="cdx-alert cdx-alert-${data.type}${align}"><div class="cdx-alert__message">${data.message}</div></div>`;
    },
    embed: function(data, config) {
      data = { ...data };
      const dataAny = data;
      if (config.embed.useProvidedLength) {
        dataAny.length = `width="${data.width}" height="${data.height}"`;
      } else {
        dataAny.length = "";
      }
      const regex = /<%data\.(.+?)%>/gm;
      if (config.embedMarkups[data.service]) {
        return config.embedMarkups[data.service].replace(
          regex,
          (match, p1) => dataAny[p1]
        );
      } else {
        return config.embedMarkups["defaultMarkup"].replace(
          regex,
          (match, p1) => dataAny[p1]
        );
      }
    }
  };
  var parsers_default = parsers;

  // src/config.ts
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
      useProvidedLength: false
      // set to true if you want the returned width and height of editorjs to be applied
      // NOTE: sometimes source site overrides the lengths so it does not work 100%
    },
    quote: {
      applyAlignment: false
      // if set to true blockquote element will have text-align css property set
    },
    delimiter: {
      tag: "br"
      // use "hr" for a semantic horizontal rule instead of the historical <br />
    }
  };
  var config_default = defaultConfig;

  // src/Parser.ts
  var edjsParser = class {
    constructor(config = {}, customs = {}, embeds = {}) {
      this.config = mergeDeep(
        config_default,
        config
      );
      this.config.embedMarkups = Object.assign({}, embedMarkups, embeds);
      this.parsers = Object.assign({}, parsers_default, customs);
    }
    parse(EditorJsObject) {
      if (!EditorJsObject || !Array.isArray(EditorJsObject.blocks)) {
        throw new Error(
          'editorjs-parser: input has no "blocks" array \u2014 pass the complete editor.js output ({ time, blocks, version })'
        );
      }
      const html = EditorJsObject.blocks.map((block) => {
        const markup = this.parseBlock(block);
        if (markup instanceof Error) {
          return "";
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
        let markup = this.parsers[block.type](block.data, this.config);
        const tunes = block.tunes || {};
        if (Array.isArray(tunes.footnotes) && tunes.footnotes.length) {
          const items = tunes.footnotes.map((t) => `<li class="cdx-footnotes__item">${t}</li>`).join("");
          markup = `${markup}<ol class="cdx-footnotes">${items}</ol>`;
        }
        if (typeof tunes.textVariant === "string" && tunes.textVariant) {
          markup = `<div class="cdx-text-variant cdx-text-variant--${tunes.textVariant}">${markup}</div>`;
        }
        const alignmentTune = Object.values(tunes).find(
          (t) => typeof t === "object" && t !== null && typeof t.alignment === "string" && t.alignment !== ""
        );
        if (alignmentTune) {
          markup = `<div style="text-align: ${alignmentTune.alignment};">${markup}</div>`;
        }
        return markup;
      } catch (err) {
        return err;
      }
    }
  };

  // src/index.ts
  var index_default = edjsParser;
  return __toCommonJS(index_exports);
})();
;if (edjsParser && edjsParser.default) { edjsParser = edjsParser.default; }
