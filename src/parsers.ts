import { sanitizeHtml } from "./utilities";
import type { ParserConfig, ParserFunction } from "./types";

interface ListItemV2 {
    content: string;
    meta?: { checked?: boolean; start?: number; counterType?: string };
    items?: ListItemV2[];
}

function renderNestedList(items: ListItemV2[], tag: "ol" | "ul"): string {
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

function renderNestedChecklist(items: ListItemV2[]): string {
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

const parsers: Record<string, ParserFunction> = {
    paragraph: function (data: { text: string }, config: ParserConfig) {
        // no padding spaces since 3.0.0 (PR #8) — round-tripping parsed
        // output back into the editor used to grow paragraphs each pass
        return `<p class="${config.paragraph.pClass}">${data.text}</p>`;
    },

    header: function (data: { text: string; level: number }) {
        return `<h${data.level}>${data.text}</h${data.level}>`;
    },

    list: function (data: {
        style?: string;
        items?: (string | ListItemV2)[];
    }) {
        const items = data.items || [];

        // legacy format ({style, items: string[]}) — output must stay byte-identical
        if (typeof items[0] === "string" || items.length === 0) {
            const type = data.style === "ordered" ? "ol" : "ul";
            const legacyItems = items.reduce<string>(
                (acc, item) => acc + `<li>${item as string}</li>`,
                ""
            );
            return `<${type}>${legacyItems}</${type}>`;
        }

        // @editorjs/list v2 ({style, items: [{content, meta, items}]})
        if (data.style === "checklist") {
            return renderNestedChecklist(items as ListItemV2[]);
        }
        return renderNestedList(
            items as ListItemV2[],
            data.style === "ordered" ? "ol" : "ul"
        );
    },

    quote: function (
        data: { text: string; caption: string; alignment?: string },
        config: ParserConfig
    ) {
        let alignment = "";
        if (config.quote.applyAlignment) {
            alignment = `style="text-align: ${data.alignment};"`;
        }
        return `<blockquote ${alignment}><p>${data.text}</p><cite>${data.caption}</cite></blockquote>`;
    },

    table: function (data: { content: string[][]; withHeadings?: boolean }) {
        const rowToTr = (row: string[], tag: "td" | "th") =>
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

    image: function (
        data: {
            url?: string;
            file?: { url: string; [key: string]: any };
            caption?: string;
            stretched?: boolean;
            withBorder?: boolean;
            withBackground?: boolean;
        },
        config: ParserConfig
    ) {
        const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${
            data.withBorder ? "img-border" : ""
        } ${data.withBackground ? "img-bg" : ""}`;
        const imgClass = config.image.imgClass || "";
        let imageSrc: string | undefined;

        if (data.url) {
            // simple-image was used and the image probably is not uploaded to this server
            // therefore, we use the absolute path provided in data.url
            // so, config.image.path property is useless in this case!
            imageSrc = data.url;
        } else if (config.image.path === "absolute") {
            imageSrc = data.file!.url;
        } else {
            imageSrc = config.image.path.replace(
                /<(.+)>/,
                (match, p1) => data.file![p1]
            );
        }

        if (config.image.use === "img") {
            return `<img class="${imageConditions} ${imgClass}" src="${imageSrc}" alt="${data.caption}">`;
        } else if (config.image.use === "figure") {
            const figureClass = config.image.figureClass || "";
            const figCapClass = config.image.figCapClass || "";

            return `<figure class="${figureClass}"><img class="${imgClass} ${imageConditions}" src="${imageSrc}" alt="${data.caption}"><figcaption class="${figCapClass}">${data.caption}</figcaption></figure>`;
        }
        return undefined as unknown as string; // unreachable with valid config — preserves legacy "bad use → undefined" behavior
    },

    code: function (data: { code: string }, config: ParserConfig) {
        const markup = sanitizeHtml(data.code);
        return `<pre><code class="${config.code.codeBlockClass}">${markup}</code></pre>`;
    },

    raw: function (data: { html: string }) {
        return data.html;
    },

    delimiter: function () {
        return "<br />";
    },

    warning: function (data: { title: string; message: string }) {
        return `<div class="cdx-warning"><div class="cdx-warning__title">${data.title}</div><div class="cdx-warning__message">${data.message}</div></div>`;
    },

    checklist: function (data: {
        items: { text: string; checked: boolean }[];
    }) {
        const items = data.items.reduce(
            (acc, item) =>
                acc +
                `<div class="cdx-checklist__item${item.checked ? " cdx-checklist__item--checked" : ""}">${item.text}</div>`,
            ""
        );
        return `<div class="cdx-checklist">${items}</div>`;
    },

    linkTool: function (data: {
        link: string;
        meta?: {
            title?: string;
            description?: string;
            image?: { url?: string };
        };
    }) {
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

    attaches: function (data: {
        title: string;
        file?: { url?: string; size?: number; name?: string; extension?: string };
    }) {
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

    personality: function (data: {
        name: string;
        description: string;
        link: string;
        photo: string;
    }) {
        return `<div class="cdx-personality"><div class="cdx-personality__photo" style="background-image: url('${data.photo}');"></div><a class="cdx-personality__name" href="${data.link}">${data.name}</a><div class="cdx-personality__description">${data.description}</div></div>`;
    },

    embed: function (
        data: {
            service: string;
            source: string;
            embed: string;
            width: number;
            height: number;
            caption?: string;
        },
        config: ParserConfig
    ) {
        data = { ...data }; // work on a copy — never mutate the caller's block data
        const dataAny = data as any;
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
    },
};

export default parsers;
