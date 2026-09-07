import { describe, it, expect } from "vitest";
import edjsParserDefault, { edjsParser } from "../src/index";

describe("entry module", () => {
    it("exports the parser as default and as a named export", () => {
        expect(edjsParserDefault).toBe(edjsParser);
    });

    it("works through the entry", () => {
        expect(new edjsParser().parseBlock({ type: "delimiter", data: {} })).toBe("<br />");
    });
});
