/**
 * Block tunes support added in 3.1.0.
 *
 * editor.js saves tunes in block.tunes (sibling of block.data). The official
 * tunes with saved data are covered:
 *  - textVariant (@editorjs/text-variant-tune): "call-out" | "citation" |
 *    "details" — the editor wraps the block in
 *    div.cdx-text-variant.cdx-text-variant--<variant> (class names verified
 *    against the tune's source src/styles/index.css), so the parser wraps the
 *    block's HTML the same way.
 *  - footnotes (@editorjs/footnotes-tune): array of footnote texts matching
 *    the <sup data-tune="footnotes">N</sup> elements in the text. The tune
 *    defines no output markup, so this parser appends
 *    <ol class="cdx-footnotes"> — our documented convention.
 *
 * Written BEFORE implementation: all cases must fail against 3.0.0.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser";

const p = new edjsParser();

describe("textVariant tune", () => {
    it.each(["call-out", "citation", "details"])(
        "wraps the block markup in the %s variant (official cdx classes)",
        (variant) => {
            expect(
                p.parseBlock({
                    type: "paragraph",
                    data: { text: "hello" },
                    tunes: { textVariant: variant },
                })
            ).toBe(
                `<div class="cdx-text-variant cdx-text-variant--${variant}"><p class="paragraph">hello</p></div>`
            );
        }
    );

    it("applies to any block type, not just paragraphs", () => {
        expect(
            p.parseBlock({
                type: "header",
                data: { text: "Title", level: 2 },
                tunes: { textVariant: "citation" },
            })
        ).toBe(
            '<div class="cdx-text-variant cdx-text-variant--citation"><h2>Title</h2></div>'
        );
    });

    it("does not wrap when the tune value is empty", () => {
        expect(
            p.parseBlock({
                type: "paragraph",
                data: { text: "hello" },
                tunes: { textVariant: "" },
            })
        ).toBe('<p class="paragraph">hello</p>');
    });
});

describe("footnotes tune", () => {
    it("appends the footnote list after the block markup", () => {
        expect(
            p.parseBlock({
                type: "paragraph",
                data: { text: 'Cited text<sup data-tune="footnotes">1</sup>' },
                tunes: { footnotes: ["This is the footnote text"] },
            })
        ).toBe(
            '<p class="paragraph">Cited text<sup data-tune="footnotes">1</sup></p>' +
                '<ol class="cdx-footnotes"><li class="cdx-footnotes__item">This is the footnote text</li></ol>'
        );
    });

    it("keeps list order matching the sup numbering", () => {
        const html = p.parseBlock({
            type: "paragraph",
            data: { text: "a<sup>1</sup> b<sup>2</sup>" },
            tunes: { footnotes: ["first", "second"] },
        }) as string;
        expect(html).toContain(
            '<li class="cdx-footnotes__item">first</li><li class="cdx-footnotes__item">second</li>'
        );
    });

    it("ignores an empty footnotes array", () => {
        expect(
            p.parseBlock({
                type: "paragraph",
                data: { text: "x" },
                tunes: { footnotes: [] },
            })
        ).toBe('<p class="paragraph">x</p>');
    });
});

describe("both tunes together", () => {
    it("wraps in the variant and appends the footnotes inside the wrapper", () => {
        expect(
            p.parseBlock({
                type: "paragraph",
                data: { text: "quote<sup>1</sup>" },
                tunes: { textVariant: "citation", footnotes: ["note"] },
            })
        ).toBe(
            '<div class="cdx-text-variant cdx-text-variant--citation">' +
                '<p class="paragraph">quote<sup>1</sup></p>' +
                '<ol class="cdx-footnotes"><li class="cdx-footnotes__item">note</li></ol>' +
                "</div>"
        );
    });
});

describe("tunes integrate with parse()", () => {
    it("renders tuned blocks inside the full document output", () => {
        expect(
            p.parse({
                blocks: [
                    { type: "paragraph", data: { text: "a" }, tunes: { textVariant: "details" } },
                ],
            })
        ).toBe('<div class="cdx-text-variant cdx-text-variant--details"><p class="paragraph">a</p></div>');
    });
});
