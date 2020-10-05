function sanitizeHtml(markup) {
    markup = markup.replace(/&/g, "&amp;");
    markup = markup.replace(/</g, "&lt;");
    markup = markup.replace(/>/g, "&gt;");
    return markup;
}

const defaultParsers = {
        paragraph: function(data) {
            return `<p> ${data.text} </p>`;
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

  image: function (data) {
    return `<img src="/img/${data.file.fileName}" alt="${data.caption}">`;
  },
  code: function (data) {
    const markup = sanitizeHtml(data.code);
    return `<pre><code class="code-block">${markup}</code></pre>`;
  },
  raw: function (data) {
    return data.html;
  },
  delimiter: function (data) {
    return "<br />";
  },

  embed: function (data) {
    switch (data.service) {
      case "youtube":
        return `<div class="embed"><iframe class="embed-youtube" frameborder="0" src="${data.embed}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;

      case "twitter":
        return `<blockquote class="twitter-tweet" class="embed-twitter"><a href="${data.source}"></a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>`;

      case "instagram":
        return `<blockquote class="instagram-media" ><a href="${data.embed}/captioned"></a></blockquote><script async defer src="//www.instagram.com/embed.js"></script>`;

      case "codepen":
        return `<div class="embed"><iframe style="width: 100%;" scrolling="no" src="${data.embed}" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe></div>`;

      default:
        return `<div class="embed"><iframe src="${data.embed}" class="embed-unknown" allowfullscreen="true" frameborder="0" ></iframe></div>`;
    }
  },
};

module.exports = defaultParsers;