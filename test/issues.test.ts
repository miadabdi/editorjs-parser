/**
 * Regression tests for reported GitHub issues.
 *
 * #10 — parse() with a document that has no "blocks" array (e.g. an
 *       API-wrapped or destructured object) used to crash with the cryptic
 *       "TypeError: Cannot read properties of undefined (reading 'map')".
 *       Fixed in 2.0.1: a clear, actionable Error is thrown instead.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser";

const p = new edjsParser();

describe("#10 — input without a blocks array", () => {
    it("throws a clear error naming the expected shape", () => {
        expect(() => p.parse({ time: 1, version: "2.24.3" } as any)).toThrow(
            'editorjs-parser: input has no "blocks" array — pass the complete editor.js output ({ time, blocks, version })'
        );
    });

    it("throws the same clear error for undefined input", () => {
        expect(() => p.parse(undefined as any)).toThrow(/no "blocks" array/);
    });

    it("still returns empty string for an empty blocks array", () => {
        expect(p.parse({ blocks: [] })).toBe("");
    });
});
