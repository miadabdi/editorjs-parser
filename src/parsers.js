import extractDomain from "extract-domain";
import { sanitizeHtml } from "./utitlities";

export default {
  paragraph: function (data, config) {
    return `<p class="${config.paragraph.pClass}"> ${data.text} </p>`;
  },

  header: function (data) {
    return `<h${data.level}>${data.text}</h${data.level}>`;
  },

  list: function (data) {
    const type = data.style === "ordered" ? "ol" : "ul";
    const items = data.items.reduce(
      (acc, item) => acc + `<li>${item}</li>`,
      ""
    );
    return `<${type}>${items}</${type}>`;
  },

  quote: function (data, config) {
    let alignment = "";
    if (config.quote.applyAlignment) {
      alignment = `style="text-align: ${data.alignment};"`;
    }
    return `<blockquote ${alignment}><p>${data.text}</p><cite>${data.caption}</cite></blockquote>`;
  },

  table: function (data) {
    const rows = data.content.map((row) => {
      return `<tr>${row.reduce(
        (acc, cell) => acc + `<td>${cell}</td>`,
        ""
      )}</tr>`;
    });
    return `<table><tbody>${rows.join("")}</tbody></table>`;
  },
  image: function (data, config) {
    const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${data.withBorder ? "img-border" : ""
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
  simpleImage: function (data, config) {
    const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${data.withBorder ? "img-border" : ""
      } ${data.withBackground ? "img-bg" : ""}`;
    const imgClass = config.simpleImage.imgClass || "";
    let imageSrc;

    if (data.url) {
      // simple-image was used and the image probably is not uploaded to this server
      // therefore, we use the absolute path provided in data.url
      // so, config.image.path property is useless in this case!
      imageSrc = data.url;
    } else if (config.simpleImage.path === "absolute") {
      imageSrc = data.file.url;
    } else {
      imageSrc = config.simpleImage.path.replace(
        /<(.+)>/,
        (match, p1) => data.file[p1]
      );
    }

    if (config.image.use === "img") {
      return `<img class="${imageConditions} ${imgClass}" src="${imageSrc}" alt="${data.caption}">`;
    } else if (config.simpleImage.use === "figure") {
      const figureClass = config.simpleImage.figureClass || "";
      const figCapClass = config.simpleImage.figCapClass || "";
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

  linkTool: function (data, config) {

    const cfg = config.linkTool // configurations for linkTool
    // Display meta tags if available (title, description)
    const imageLink = data?.meta?.image.URL || data?.meta?.image.url || ''
    let imageDiv = ''
    if (imageLink?.length > 0) {
      imageDiv = `<div class="${cfg.imgWrapperClass}">
        <div class="${cfg.imgBgClass}" style="background-image: url(${imageLink})"></div>
      </div>`
    }
    return `
      <a class=" ${cfg.linkCardClass}" href="${data.link}" target="_blank">
        <div class=${cfg.linkToolMainClass}>
          <div>
            ${data?.meta?.title?.length > 0 ? '<p class=' + cfg.titleClass + '>' + data.meta.title + '</p>' : ''}
            ${data?.meta?.description?.length > 0 ? '<p class=' + cfg.descriptionClass + '>' + data.meta.description + '</p>' : ''}
            <p class="${cfg.linkClass}">${extractDomain(data.link)}</p>
          </div>
        </div>
        ${imageDiv}
      </a>`
  }
};