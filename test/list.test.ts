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

describe("list v2 ordered block metadata", () => {
    const items = [{ content: "third" }, { content: "fourth" }];

    it.each([
        [{ start: 3, counterType: "lower-roman" }, '<ol start="3" style="list-style-type: lower-roman;">'],
        [{ start: 3 }, '<ol start="3">'],
        [{ start: 0 }, '<ol start="0">'],
        [{ start: -2 }, '<ol start="-2">'],
        [{ start: Number.MAX_SAFE_INTEGER }, '<ol start="9007199254740991">'],
        [{ start: Number.MIN_SAFE_INTEGER }, '<ol start="-9007199254740991">'],
        ...["lower-roman", "upper-roman", "lower-alpha", "upper-alpha"].map(
            (counterType): [{ counterType: string }, string] => [{ counterType }, `<ol style="list-style-type: ${counterType};">`]
        ),
        [undefined, "<ol>"],
        [{}, "<ol>"],
        [{ start: 1, counterType: "numeric" }, "<ol>"],
    ])("renders metadata %j through both APIs", (meta, opening) => {
        const block = { type: "list", data: { style: "ordered", meta, items } };
        const expected = `${opening}<li>third</li><li>fourth</li></ol>`;
        expect(p.parseBlock(block)).toBe(expected);
        expect(p.parse({ blocks: [block] })).toBe(expected);
    });

    it.each([
        "3", '3" onclick="bad', null, true, {}, [], 1.5, NaN, Infinity,
        -Infinity, Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1,
    ].map((start) => [start]))("ignores invalid start %j without losing valid style or inline HTML", (start) => {
        expect(p.parseBlock({
            type: "list",
            data: { style: "ordered", meta: { start, counterType: "upper-alpha" }, items: [{ content: "<b>third</b>" }] },
        })).toBe('<ol style="list-style-type: upper-alpha;"><li><b>third</b></li></ol>');
    });

    it.each(["numeric", "unknown", 'lower-roman; color: red', 'lower-roman\" onclick=\"bad', "toString", "", null, 3, {}])(
        "ignores non-allowlisted counter type %j at every level", (counterType) => {
            expect(p.parseBlock({
                type: "list",
                data: { style: "ordered", meta: { start: 3, counterType }, items: [{ content: "parent", items: [{ content: "child" }] }] },
            })).toBe('<ol start="3"><li>parent<ol><li>child</li></ol></li></ol>');
        }
    );

    it.each(["lower-roman", "upper-roman", "lower-alpha", "upper-alpha"])(
        "propagates only block counter style %s through two child levels", (counterType) => {
            const block = {
                type: "list",
                data: {
                    style: "ordered", meta: { start: 3, counterType },
                    items: [
                        { content: "parent", meta: { start: 9, counterType: "upper-alpha" }, items: [
                            { content: "child", meta: { start: 7, counterType: "numeric" }, items: [{ content: "grandchild" }] },
                        ] },
                        { content: "next" },
                    ],
                },
            };
            const expected = `<ol start="3" style="list-style-type: ${counterType};"><li>parent<ol style="list-style-type: ${counterType};"><li>child<ol style="list-style-type: ${counterType};"><li>grandchild</li></ol></li></ol></li><li>next</li></ol>`;
            expect(p.parseBlock(block)).toBe(expected);
            expect(p.parse({ blocks: [block] })).toBe(expected);
        }
    );

    it.each([
        ["ordered", { start: 3, counterType: "lower-roman" }, '<ol start="3" style="list-style-type: lower-roman;"></ol>'],
        ["ordered", undefined, "<ol></ol>"],
        ["unordered", { start: 3, counterType: "lower-roman" }, "<ul></ul>"],
        ["checklist", { start: 3, counterType: "lower-roman" }, "<ul></ul>"],
    ])("preserves empty %s behavior with metadata %j", (style, meta, expected) => {
        expect(p.parseBlock({ type: "list", data: { style, meta, items: [] } })).toBe(expected);
    });

    it.each([
        ["ordered", ["third", "fourth"], "<ol><li>third</li><li>fourth</li></ol>"],
        ["unordered", ["third"], "<ul><li>third</li></ul>"],
        ["unordered", [{ content: "parent", items: [{ content: "child" }] }], "<ul><li>parent<ul><li>child</li></ul></li></ul>"],
        ["checklist", [{ content: "done", meta: { checked: true } }], '<div class="cdx-checklist"><div class="cdx-checklist__item cdx-checklist__item--checked">done</div></div>'],
    ])("does not apply ordered metadata to legacy/control %s lists", (style, controlItems, expected) => {
        expect(p.parseBlock({ type: "list", data: { style, meta: { start: 3, counterType: "lower-roman" }, items: controlItems } })).toBe(expected);
    });

    it("ignores item numbering metadata when block metadata is absent", () => {
        expect(p.parseBlock({ type: "list", data: { style: "ordered", items: [
            { content: "parent", meta: { start: 3, counterType: "lower-roman" }, items: [{ content: "child", meta: { start: 5, counterType: "upper-alpha" } }] },
        ] } })).toBe("<ol><li>parent<ol><li>child</li></ol></li></ol>");
    });

    it("renders recursively frozen input without mutating block or item metadata", () => {
        const block = { type: "list", data: { style: "ordered", meta: { start: 3, counterType: "lower-roman" }, items: [
            { content: "<b>parent</b>", meta: { start: 8, counterType: "upper-alpha" }, items: [{ content: "child", meta: {}, items: [] }] },
        ] } };
        const snapshot = structuredClone(block);
        function freeze(value: object) {
            Object.values(value).forEach((child) => {
                if (child && typeof child === "object") freeze(child);
            });
            Object.freeze(value);
        }
        freeze(block);
        const expected = '<ol start="3" style="list-style-type: lower-roman;"><li><b>parent</b><ol style="list-style-type: lower-roman;"><li>child</li></ol></li></ol>';
        expect(p.parseBlock(block)).toBe(expected);
        expect(p.parse({ blocks: [block] })).toBe(expected);
        expect(block).toEqual(snapshot);
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
