import { describe, it, expect } from "vitest";
import edjsParser from "../src/index";
import type { EditorJSOutput } from "../src/index";

describe("entry module", () => {
    it("exports the parser as the default export", () => {
        expect(typeof edjsParser).toBe("function");
    });

    it("works through the entry", () => {
        expect(new edjsParser().parseBlock({ type: "delimiter", data: {} })).toBe("<br />");
    });

    it("exports the public types (compile-time check)", () => {
        const doc: EditorJSOutput = { blocks: [{ type: "paragraph", data: { text: "x" } }] };
        expect(new edjsParser().parse(doc)).toBe('<p class="paragraph">x</p>');
    });
});
