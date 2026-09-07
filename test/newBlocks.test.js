/**
 * New block parsers added in 1.6.0 — warning, checklist, linkTool, attaches,
 * personality. Markup follows the official editor.js tools' own classes
 * (cdx-* BEM; the Link tool uses link-tool-*).
 *
 * Written BEFORE the parsers exist: every test must fail with "not supported"
 * against 1.5.4, then pass once src/parsers.js gains the five entries.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser.js";

const p = new edjsParser();

describe("warning", () => {
    it("renders title and message in cdx-warning markup", () => {
        expect(
            p.parseBlock({
                type: "warning",
                data: { title: "Watch Out!!!<br>", message: "This is a test WARNING!<br>" },
            })
        ).toBe(
            '<div class="cdx-warning"><div class="cdx-warning__title">Watch Out!!!<br></div><div class="cdx-warning__message">This is a test WARNING!<br></div></div>'
        );
    });
});

describe("checklist (deprecated standalone tool)", () => {
    it("renders checked and unchecked items with the --checked modifier", () => {
        expect(
            p.parseBlock({
                type: "checklist",
                data: {
                    items: [
                        { text: "I'm a Developer", checked: true },
                        { text: "I love science!", checked: false },
                    ],
                },
            })
        ).toBe(
            '<div class="cdx-checklist"><div class="cdx-checklist__item cdx-checklist__item--checked">I\'m a Developer</div><div class="cdx-checklist__item">I love science!</div></div>'
        );
    });
});

describe("linkTool", () => {
    const fullData = {
        link: "https://editorjs.io/your-telegram-bot/",
        meta: {
            title: "Your Telegram Bot",
            description: "How to create a bot",
            image: { url: "https://editorjs.io/telegram.png" },
        },
    };

    it("renders the card with image, title, description and hostname anchor", () => {
        expect(p.parseBlock({ type: "linkTool", data: fullData })).toBe(
            '<a class="link-tool__content link-tool__content--rendered" href="https://editorjs.io/your-telegram-bot/" target="_blank" rel="nofollow noindex noreferrer">' +
                '<div class="link-tool__image" style="background-image: url(\'https://editorjs.io/telegram.png\')"></div>' +
                "<div class=\"link-tool__title\">Your Telegram Bot</div>" +
                '<p class="link-tool__description">How to create a bot</p>' +
                '<span class="link-tool__anchor">editorjs.io</span>' +
                "</a>"
        );
    });

    it("omits missing meta parts", () => {
        expect(
            p.parseBlock({ type: "linkTool", data: { link: "https://example.com/page" } })
        ).toBe(
            '<a class="link-tool__content link-tool__content--rendered" href="https://example.com/page" target="_blank" rel="nofollow noindex noreferrer">' +
                '<span class="link-tool__anchor">example.com</span>' +
                "</a>"
        );
    });

    it("falls back to the raw link as anchor text when the link is not parseable", () => {
        expect(
            p.parseBlock({ type: "linkTool", data: { link: "not a url" } })
        ).toContain('<span class="link-tool__anchor">not a url</span>');
    });
});

describe("attaches", () => {
    it("renders the download card with extension label and KiB size", () => {
        expect(
            p.parseBlock({
                type: "attaches",
                data: {
                    title: "My report",
                    file: { url: "https://example.com/report.pdf", size: 5120, name: "report.pdf", extension: "pdf" },
                },
            })
        ).toBe(
            '<div class="cdx-attaches cdx-attaches--with-file">' +
                '<a class="cdx-attaches__download-button" href="https://example.com/report.pdf" target="_blank"></a>' +
                '<div class="cdx-attaches__file-info">' +
                '<div class="cdx-attaches__file-icon"><div class="cdx-attaches__file-icon-background"><div class="cdx-attaches__file-icon-label">pdf</div></div></div>' +
                '<div class="cdx-attaches__title">My report</div>' +
                '<span class="cdx-attaches__size">5.0 KiB</span>' +
                "</div></div>"
        );
    });

    it("uses MiB for sizes of a million bytes and up", () => {
        const html = p.parseBlock({
            type: "attaches",
            data: { title: "Big", file: { url: "https://example.com/big.zip", size: 1572864, extension: "zip" } },
        });
        expect(html).toContain('<span class="cdx-attaches__size">1.5 MiB</span>');
    });

    it("omits the size span when no size is provided", () => {
        const html = p.parseBlock({
            type: "attaches",
            data: { title: "No size", file: { url: "https://example.com/x.png", extension: "png" } },
        });
        expect(html).not.toContain("cdx-attaches__size");
    });
});

describe("personality", () => {
    it("renders photo, linked name and description", () => {
        expect(
            p.parseBlock({
                type: "personality",
                data: {
                    name: "Admiral Grace Hopper",
                    description: "Invented the compiler.",
                    link: "https://en.wikipedia.org/wiki/Grace_Hopper",
                    photo: "https://example.com/grace.jpg",
                },
            })
        ).toBe(
            '<div class="cdx-personality">' +
                '<div class="cdx-personality__photo" style="background-image: url(\'https://example.com/grace.jpg\');"></div>' +
                '<a class="cdx-personality__name" href="https://en.wikipedia.org/wiki/Grace_Hopper">Admiral Grace Hopper</a>' +
                '<div class="cdx-personality__description">Invented the compiler.</div>' +
                "</div>"
        );
    });
});

describe("new blocks integrate with parse()", () => {
    it("renders instead of dropping to empty string", () => {
        const html = p.parse({
            blocks: [
                { type: "warning", data: { title: "T", message: "M" } },
                { type: "checklist", data: { items: [{ text: "a", checked: true }] } },
            ],
        });
        expect(html).toBe(
            '<div class="cdx-warning"><div class="cdx-warning__title">T</div><div class="cdx-warning__message">M</div></div>' +
                '<div class="cdx-checklist"><div class="cdx-checklist__item cdx-checklist__item--checked">a</div></div>'
        );
    });
});
