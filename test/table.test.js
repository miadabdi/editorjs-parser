/**
 * Table rendering — withHeadings support added in 1.8.0, plus regression
 * guards that tables without headings stay byte-identical to pre-1.8.0.
 *
 * Written BEFORE the implementation: the withHeadings cases must fail against
 * 1.7.0 (headings render as plain td), the no-headings cases must pass.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser.js";

const p = new edjsParser();

describe("tables without headings — byte-identical to 1.7.x", () => {
    it("renders all cells as td inside tbody", () => {
        expect(
            p.parseBlock({
                type: "table",
                data: {
                    content: [
                        ["", "Me", "Me"],
                        ["You", "Ugly", "Big"],
                    ],
                },
            })
        ).toBe(
            "<table><tbody><tr><td></td><td>Me</td><td>Me</td></tr><tr><td>You</td><td>Ugly</td><td>Big</td></tr></tbody></table>"
        );
    });

    it("renders explicit withHeadings: false as plain td", () => {
        expect(
            p.parseBlock({
                type: "table",
                data: {
                    withHeadings: false,
                    content: [
                        ["A", "B"],
                        ["1", "2"],
                    ],
                },
            })
        ).toBe("<table><tbody><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></tbody></table>");
    });
});

describe("tables with headings (1.8.0)", () => {
    it("renders the first row as th inside thead", () => {
        expect(
            p.parseBlock({
                type: "table",
                data: {
                    withHeadings: true,
                    content: [
                        ["", "Me", "Me"],
                        ["You", "Ugly", "Big"],
                    ],
                },
            })
        ).toBe(
            "<table><thead><tr><th></th><th>Me</th><th>Me</th></tr></thead><tbody><tr><td>You</td><td>Ugly</td><td>Big</td></tr></tbody></table>"
        );
    });

    it("renders a single-row table with an empty tbody", () => {
        expect(
            p.parseBlock({
                type: "table",
                data: { withHeadings: true, content: [["A", "B"]] },
            })
        ).toBe("<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody></tbody></table>");
    });

    it("renders an empty table as before", () => {
        expect(p.parseBlock({ type: "table", data: { withHeadings: true, content: [] } })).toBe(
            "<table><tbody></tbody></table>"
        );
    });
});
