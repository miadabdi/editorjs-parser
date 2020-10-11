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

    quote: function(data) {
        return `<blockquote><p>${data.text}</p><cite>${data.caption}</cite></blockquote>`;
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