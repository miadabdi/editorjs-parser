/**
 * Regression tests for two bugs fixed in 1.5.4. Written BEFORE the fixes —
 * both fail against 1.5.3:
 *
 *   (a) constructor mutated module-level defaultParsers/embedMarkups, so an
 *       instance constructed with customs/embeds polluted every other (and
 *       every future) instance in the process;
 *   (b) the embed parser wrote data.length onto the caller's block object.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser";

describe("instance isolation (constructor must not mutate module defaults)", () => {
    it("keeps other instances' parsers untouched", () => {
        const customized = new edjsParser({}, { paragraph: () => "<p>custom</p>" });
        expect(customized.parseBlock({ type: "paragraph", data: { text: "x" } })).toBe("<p>custom</p>");

        const fresh = new edjsParser();
        expect(fresh.parseBlock({ type: "paragraph", data: { text: "x" } })).toBe(
            '<p class="paragraph"> x </p>'
        );
    });

    it("keeps other instances' embed markups untouched", () => {
        const customized = new edjsParser({}, {}, { youtube: "OVERRIDE" });
        expect(customized.parseBlock({
            type: "embed",
            data: { service: "youtube", embed: "e", width: 1, height: 2 },
        })).toBe("OVERRIDE");

        const fresh = new edjsParser();
        expect(fresh.config.embedMarkups.youtube).toContain("embed-youtube");
    });

    it("keeps a customized type from leaking into instances created later", () => {
        new edjsParser({}, { fakeLeak: () => "<div>leak</div>" }); // eslint-disable-line no-new
        const fresh = new edjsParser();
        const result = fresh.parseBlock({ type: "fakeLeak", data: {} });
        expect(result).toBeInstanceOf(Error);
        expect(result.message).toBe("fakeLeak is not supported! Define your own custom function.");
    });
});

describe("embed must not mutate its input data", () => {
    it("leaves no length property on the parsed block's data", () => {
        const p = new edjsParser();
        const data = { service: "youtube", source: "s", embed: "e", width: 580, height: 320, caption: "" };
        p.parseBlock({ type: "embed", data });
        expect("length" in data).toBe(false);
    });

    it("produces correct output when the same data is parsed under different configs", () => {
        const data = { service: "youtube", source: "s", embed: "e", width: 580, height: 320, caption: "" };
        const withoutLength = new edjsParser();
        const withLength = new edjsParser({ embed: { useProvidedLength: true } });

        const first = withoutLength.parseBlock({ type: "embed", data });
        const second = withLength.parseBlock({ type: "embed", data });

        expect(first).toContain("allowfullscreen >");
        expect(second).toContain('allowfullscreen width="580" height="320">');
    });
});
