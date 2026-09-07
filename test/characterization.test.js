/**
 * Characterization contract — pins the library's CURRENT output byte-for-byte,
 * quirks included. This is the backward-compatibility guarantee: any deliberate
 * behavior change must update the affected assertion in the same commit.
 *
 * Only default instances are used here (no customs/embeds constructor args) —
 * pre-1.5.4, constructing an instance with customs mutates module-level state
 * and would leak into these tests.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser.js";

const p = new edjsParser();

describe("paragraph", () => {
    it("wraps text with literal inner spaces", () => {
        expect(
            p.parseBlock({ type: "paragraph", data: { text: "Hello <b>world</b>" } })
        ).toBe('<p class="paragraph"> Hello <b>world</b> </p>');
    });

    it("uses configured pClass", () => {
        const custom = new edjsParser({ paragraph: { pClass: "lead" } });
        expect(
            custom.parseBlock({ type: "paragraph", data: { text: "Hi" } })
        ).toBe('<p class="lead"> Hi </p>');
    });
});

describe("header", () => {
    it("renders level 2", () => {
        expect(
            p.parseBlock({ type: "header", data: { text: "Google's attributes", level: 2 } })
        ).toBe("<h2>Google's attributes</h2>");
    });

    it("renders level 1 and level 6", () => {
        expect(p.parseBlock({ type: "header", data: { text: "Title", level: 1 } })).toBe("<h1>Title</h1>");
        expect(p.parseBlock({ type: "header", data: { text: "Deep", level: 6 } })).toBe("<h6>Deep</h6>");
    });
});

describe("list (legacy string items)", () => {
    it("renders ordered lists", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: { style: "ordered", items: ["Search Engine", "Google fonts", "Google images", "Google maps"] },
            })
        ).toBe(
            "<ol><li>Search Engine</li><li>Google fonts</li><li>Google images</li><li>Google maps</li></ol>"
        );
    });

    it("renders unordered lists", () => {
        expect(
            p.parseBlock({ type: "list", data: { style: "unordered", items: ["a", "b"] } })
        ).toBe("<ul><li>a</li><li>b</li></ul>");
    });

    it("renders any non-ordered style as ul", () => {
        expect(
            p.parseBlock({ type: "list", data: { style: "checklist", items: ["x"] } })
        ).toBe("<ul><li>x</li></ul>");
    });

    it("stringifies object items (documented broken path — flips in v1.7.0)", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: { style: "unordered", items: [{ content: "a", items: [] }, { content: "b", items: [] }] },
            })
        ).toBe("<ul><li>[object Object]</li><li>[object Object]</li></ul>");
    });
});

describe("quote", () => {
    const data = {
        text: "Healthiness quote.",
        caption: "Larry Page",
        alignment: "left",
    };

    it("renders with a trailing space inside the blockquote tag by default", () => {
        expect(p.parseBlock({ type: "quote", data })).toBe(
            "<blockquote ><p>Healthiness quote.</p><cite>Larry Page</cite></blockquote>"
        );
    });

    it("applies alignment style when configured", () => {
        const aligned = new edjsParser({ quote: { applyAlignment: true } });
        expect(aligned.parseBlock({ type: "quote", data })).toBe(
            '<blockquote style="text-align: left;"><p>Healthiness quote.</p><cite>Larry Page</cite></blockquote>'
        );
    });
});

describe("table", () => {
    const content = [
        ["", "Me", "Me"],
        ["You", "Ugly", "Big"],
    ];

    it("renders all cells as td inside tbody", () => {
        expect(p.parseBlock({ type: "table", data: { content } })).toBe(
            "<table><tbody><tr><td></td><td>Me</td><td>Me</td></tr><tr><td>You</td><td>Ugly</td><td>Big</td></tr></tbody></table>"
        );
    });

    it("ignores withHeadings (documented broken path — flips in v1.8.0)", () => {
        expect(p.parseBlock({ type: "table", data: { content, withHeadings: true } })).toBe(
            "<table><tbody><tr><td></td><td>Me</td><td>Me</td></tr><tr><td>You</td><td>Ugly</td><td>Big</td></tr></tbody></table>"
        );
    });
});

describe("image", () => {
    const simpleData = {
        url: "https://www.tesla.com/tesla_theme/assets/img/_vehicle_red/roadster_and_semi/roadster/hero.jpg",
        caption: "Roadster // tesla.com",
        withBorder: false,
        withBackground: false,
        stretched: true,
    };
    const fileData = {
        file: {
            url: "http://127.0.0.1:5000/img/photo-160184.jpg",
            fileName: "photo-160184.jpg",
        },
        caption: "dfvsdfvdsvdfvs",
        withBorder: false,
        withBackground: false,
        stretched: true,
    };

    it("renders simple-image (data.url) as figure by default, with stray class spaces", () => {
        expect(p.parseBlock({ type: "image", data: simpleData })).toBe(
            '<figure class="fig-img"><img class="img img-fullwidth  " src="https://www.tesla.com/tesla_theme/assets/img/_vehicle_red/roadster_and_semi/roadster/hero.jpg" alt="Roadster // tesla.com"><figcaption class="fig-cap">Roadster // tesla.com</figcaption></figure>'
        );
    });

    it("renders bare img when configured with use: img", () => {
        const imgOnly = new edjsParser({ image: { use: "img" } });
        expect(imgOnly.parseBlock({ type: "image", data: simpleData })).toBe(
            '<img class="img-fullwidth   img" src="https://www.tesla.com/tesla_theme/assets/img/_vehicle_red/roadster_and_semi/roadster/hero.jpg" alt="Roadster // tesla.com">'
        );
    });

    it("uses data.file.url when path is absolute", () => {
        expect(p.parseBlock({ type: "image", data: fileData })).toContain(
            'src="http://127.0.0.1:5000/img/photo-160184.jpg"'
        );
    });

    it("applies the path template with a file property token", () => {
        const templated = new edjsParser({ image: { path: "/img/<fileName>" } });
        expect(templated.parseBlock({ type: "image", data: fileData })).toContain(
            'src="/img/photo-160184.jpg"'
        );
    });

    it("renders literal undefined for alt and figcaption when caption is missing", () => {
        const noCaption = { url: "https://example.com/a.png" };
        expect(p.parseBlock({ type: "image", data: noCaption })).toBe(
            '<figure class="fig-img"><img class="img   " src="https://example.com/a.png" alt="undefined"><figcaption class="fig-cap">undefined</figcaption></figure>'
        );
    });
});

describe("code", () => {
    it("escapes ampersands and angle brackets only", () => {
        expect(
            p.parseBlock({ type: "code", data: { code: 'say "hi" & <b>now</b>' } })
        ).toBe('<pre><code class="code-block">say "hi" &amp; &lt;b&gt;now&lt;/b&gt;</code></pre>');
    });

    it("uses configured codeBlockClass", () => {
        const custom = new edjsParser({ code: { codeBlockClass: "hljs" } });
        expect(custom.parseBlock({ type: "code", data: { code: "x < y" } })).toBe(
            '<pre><code class="hljs">x &lt; y</code></pre>'
        );
    });
});

describe("raw", () => {
    it("passes html through verbatim", () => {
        const html = '<blockquote class="imgur-embed-pub"><a href="//imgur.com/a/Vd1xADQ">x</a></blockquote><script async src="//s.imgur.com/min/embed.js" charset="utf-8"></script>';
        expect(p.parseBlock({ type: "raw", data: { html } })).toBe(html);
    });
});

describe("delimiter", () => {
    it("renders a br, ignoring data", () => {
        expect(p.parseBlock({ type: "delimiter", data: {} })).toBe("<br />");
        expect(p.parseBlock({ type: "delimiter" })).toBe("<br />");
    });
});

describe("embed", () => {
    const youtubeData = {
        service: "youtube",
        source: "https://www.youtube.com/watch?v=1z6sLQJHbP0",
        embed: "https://www.youtube.com/embed/1z6sLQJHbP0",
        width: 580,
        height: 320,
        caption: "This is a Youtube video!<br>",
    };

    it("renders the youtube template with an empty length by default", () => {
        expect(p.parseBlock({ type: "embed", data: youtubeData })).toBe(
            '<div class="embed"><iframe class="embed-youtube" frameborder="0" src="https://www.youtube.com/embed/1z6sLQJHbP0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen ></iframe></div>'
        );
    });

    it("falls back to defaultMarkup for unknown services, stray spaces verbatim", () => {
        const vimeo = { service: "vimeo", source: "s", embed: "https://vimeo.com/123", width: 1, height: 2, caption: "" };
        expect(p.parseBlock({ type: "embed", data: vimeo })).toBe(
            '<div class="embed"><iframe src="https://vimeo.com/123"  class="embed-unknown" allowfullscreen="true" frameborder="0" ></iframe></div>'
        );
    });

    it("applies width/height when useProvidedLength is true", () => {
        const withLength = new edjsParser({ embed: { useProvidedLength: true } });
        expect(withLength.parseBlock({ type: "embed", data: youtubeData })).toBe(
            '<div class="embed"><iframe class="embed-youtube" frameborder="0" src="https://www.youtube.com/embed/1z6sLQJHbP0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen width="580" height="320"></iframe></div>'
        );
    });

    it("renders the twitter template verbatim, duplicate class attribute included", () => {
        const twitter = {
            service: "twitter",
            source: "https://twitter.com/elonmusk/status/1310001082278371328",
            embed: "https://twitframe.com/show?url=x",
            width: 600,
            height: 300,
            caption: "",
        };
        expect(p.parseBlock({ type: "embed", data: twitter })).toBe(
            '<blockquote class="twitter-tweet" class="embed-twitter" ><a href="https://twitter.com/elonmusk/status/1310001082278371328"></a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>'
        );
    });
});

describe("parse() mechanics", () => {
    it("joins block output with no separator and drops unknown blocks", () => {
        expect(
            p.parse({
                blocks: [
                    { type: "delimiter", data: {} },
                    { type: "paragraph", data: { text: "a" } },
                    { type: "fakeTool", data: {} },
                ],
            })
        ).toBe('<br /><p class="paragraph"> a </p>');
    });

    it("returns an Error from parseBlock for unknown types", () => {
        const result = p.parseBlock({ type: "fakeTool", data: {} });
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe("fakeTool is not supported! Define your own custom function.");
    });
});

describe("config deep merge", () => {
    it("overrides only the given nested key", () => {
        const custom = new edjsParser({ image: { imgClass: "pic" } });
        expect(custom.config.image.use).toBe("figure");
        expect(custom.config.image.imgClass).toBe("pic");
        expect(custom.config.paragraph.pClass).toBe("paragraph");
    });
});
