/**
 * End-to-end parse of the real editor.js sample document (test/testData.json).
 * Before 1.6.0 the warning and checklist blocks silently rendered as "";
 * they must now produce real markup. Also guards that parsing never mutates
 * the input document (regression net for the 1.5.4 embed bugfix).
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser.js";
import doc from "./testData.json";

describe("full document", () => {
    it("renders every block in the sample document", () => {
        const html = new edjsParser().parse(doc);
        expect(html).toContain("<h2>Google's attributes</h2>");
        expect(html).toContain('<div class="cdx-warning__title">Watch Out!!!<br></div>');
        expect(html).toContain("cdx-checklist__item--checked");
        expect(html).toContain("<br />");
        expect(html).not.toContain("is not supported");
    });

    it("does not mutate the parsed document", () => {
        const before = JSON.stringify(doc);
        new edjsParser().parse(doc);
        expect(JSON.stringify(doc)).toBe(before);
    });

    it("supports the old test.js configuration shape (custom embeds, alignment)", () => {
        const parser = new edjsParser(
            { embed: { useProvidedLength: false }, quote: { applyAlignment: true } },
            {},
            {
                youtube: "<THIS IS YOUTUBE EMBED><%data.embed%><%data.length%><THIS IS FOR TESTING>",
            }
        );
        const html = parser.parse(doc);
        expect(html).toContain("<THIS IS YOUTUBE EMBED>https://www.youtube.com/embed/1z6sLQJHbP0<THIS IS FOR TESTING>");
        expect(html).toContain('<blockquote style="text-align: left;">');
    });
});
