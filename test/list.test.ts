/**
 * List rendering — @editorjs/list v2 format ({style, items: [{content, meta,
 * items}]}, recursive nesting, checklist style) alongside the legacy flat
 * format ({style, items: string[]}), whose output must stay byte-identical
 * to pre-1.7.0.
 *
 * Written BEFORE the v2 implementation: the v2 cases must fail against 1.6.0
 * (object items stringify to "[object Object]"), while the legacy cases must
 * already pass.
 */
import { describe, it, expect } from "vitest";
import edjsParser from "../src/Parser";

const p = new edjsParser();

describe("legacy format (items: string[]) — byte-identical to 1.5.x", () => {
    it("renders ordered lists", () => {
        expect(
            p.parseBlock({ type: "list", data: { style: "ordered", items: ["a", "b", "c"] } })
        ).toBe("<ol><li>a</li><li>b</li><li>c</li></ol>");
    });

    it("renders unordered lists", () => {
        expect(
            p.parseBlock({ type: "list", data: { style: "unordered", items: ["a", "b"] } })
        ).toBe("<ul><li>a</li><li>b</li></ul>");
    });

    it("keeps inline markup in items", () => {
        expect(
            p.parseBlock({ type: "list", data: { style: "unordered", items: ["<b>bold</b> item"] } })
        ).toBe("<ul><li><b>bold</b> item</li></ul>");
    });
});

describe("list v2 format (items: [{content, meta, items}])", () => {
    it("renders flat ordered lists", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: {
                    style: "ordered",
                    items: [
                        { content: "a", meta: {}, items: [] },
                        { content: "b", meta: {}, items: [] },
                    ],
                },
            })
        ).toBe("<ol><li>a</li><li>b</li></ol>");
    });

    it("renders flat unordered lists", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: {
                    style: "unordered",
                    items: [
                        { content: "a", meta: {}, items: [] },
                        { content: "b", meta: {}, items: [] },
                    ],
                },
            })
        ).toBe("<ul><li>a</li><li>b</li></ul>");
    });

    it("nests child lists inside the parent li", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: {
                    style: "unordered",
                    items: [
                        {
                            content: "a",
                            meta: {},
                            items: [
                                { content: "a1", meta: {}, items: [] },
                                { content: "a2", meta: {}, items: [] },
                            ],
                        },
                        { content: "b", meta: {}, items: [] },
                    ],
                },
            })
        ).toBe("<ul><li>a<ul><li>a1</li><li>a2</li></ul></li><li>b</li></ul>");
    });

    it("nests two levels deep, keeping the ordered tag at every level", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: {
                    style: "ordered",
                    items: [
                        {
                            content: "a",
                            meta: {},
                            items: [
                                { content: "a1", meta: {}, items: [{ content: "a1x", meta: {}, items: [] }] },
                            ],
                        },
                    ],
                },
            })
        ).toBe("<ol><li>a<ol><li>a1<ol><li>a1x</li></ol></li></ol></li></ol>");
    });

    it("tolerates missing items and meta fields", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: { style: "unordered", items: [{ content: "lonely" }] },
            })
        ).toBe("<ul><li>lonely</li></ul>");
    });

    it("renders an empty list as empty tags", () => {
        expect(p.parseBlock({ type: "list", data: { style: "ordered", items: [] } })).toBe("<ol></ol>");
    });
});

describe("list v2 checklist style", () => {
    it("renders cdx-checklist markup with checked modifiers from meta", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: {
                    style: "checklist",
                    items: [
                        { content: "buy milk", meta: { checked: true }, items: [] },
                        { content: "sleep", meta: { checked: false }, items: [] },
                    ],
                },
            })
        ).toBe(
            '<div class="cdx-checklist"><div class="cdx-checklist__item cdx-checklist__item--checked">buy milk</div><div class="cdx-checklist__item">sleep</div></div>'
        );
    });

    it("nests checklist items", () => {
        expect(
            p.parseBlock({
                type: "list",
                data: {
                    style: "checklist",
                    items: [
                        {
                            content: "parent",
                            meta: { checked: true },
                            items: [{ content: "child", meta: {}, items: [] }],
                        },
                    ],
                },
            })
        ).toBe(
            '<div class="cdx-checklist"><div class="cdx-checklist__item cdx-checklist__item--checked">parent<div class="cdx-checklist"><div class="cdx-checklist__item">child</div></div></div></div>'
        );
    });
});
