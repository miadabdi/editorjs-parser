import { sanitizeHtml } from "./utitlities";

export default {
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