/**
 * Characterization of the extension mechanisms — custom block parsers
 * (2nd constructor arg) and custom embed markups (3rd arg).
 *
 * Lives in its own file: pre-1.5.4 these constructor args mutate module-level
 * defaults, so constructing such instances pollutes module state for later
 * tests in the same file. Vitest isolates each test file in a fresh module
 * registry, so the pollution cannot leak into the other suites.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser.js";

describe("custom parsers (2nd constructor arg)", () => {
    it("overrides an existing type for this instance", () => {
        const p = new edjsParser({}, { paragraph: () => "<p>custom</p>" });
        expect(p.parseBlock({ type: "paragraph", data: { text: "x" } })).toBe("<p>custom</p>");
    });

    it("leaves non-overridden types on their defaults", () => {
        const p = new edjsParser({}, { paragraph: () => "<p>custom</p>" });
        expect(p.parseBlock({ type: "header", data: { text: "T", level: 2 } })).toBe("<h2>T</h2>");
    });

    it("adds support for a previously unknown type", () => {
        const p = new edjsParser({}, { fakeTool: (data) => `<div>${data.msg}</div>` });
        expect(p.parseBlock({ type: "fakeTool", data: { msg: "hi" } })).toBe("<div>hi</div>");
    });

    it("returns a thrown parser error instead of propagating it", () => {
        const p = new edjsParser(undefined, { fakeTool: () => { throw new Error("boom"); } });
        const result = p.parseBlock({ type: "fakeTool", data: {} });
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe("boom");
    });
});

describe("custom embeds (3rd constructor arg)", () => {
    it("overrides a built-in service template with <%data.X%> replacement", () => {
        const p = new edjsParser({}, {}, {
            youtube: '<THIS IS YOUTUBE EMBED><%data.embed%><%data.length%><THIS IS FOR TESTING>',
        });
        expect(
            p.parseBlock({
                type: "embed",
                data: { service: "youtube", embed: "https://www.youtube.com/embed/X", width: 580, height: 320 },
            })
        ).toBe("<THIS IS YOUTUBE EMBED>https://www.youtube.com/embed/X<THIS IS FOR TESTING>");
    });

    it("replaces length with width/height attrs when useProvidedLength is true", () => {
        const p = new edjsParser({ embed: { useProvidedLength: true } }, {}, {
            youtube: "L:<%data.length%>",
        });
        expect(
            p.parseBlock({
                type: "embed",
                data: { service: "youtube", embed: "e", width: 580, height: 320 },
            })
        ).toBe('L:width="580" height="320"');
    });
});
