// Asserting + eyeball check of the SHIPPED bundle (dist/index.cjs), not src/.
// vitest imports src/ only, so this is the one place that exercises the tsup
// output — it pins the CJS footer unwrap (new (require(...))() keeps working)
// and that the built bundle actually parses the fixture.
const assert = require("node:assert/strict");
const testObject = require("./testData.json");
const edjsParser = require("../dist/index.cjs");

// the tsup CJS footer must unwrap { default: Class } → the class itself,
// so the historical `new (require("editorjs-parser"))()` keeps working
assert.equal(typeof edjsParser, "function");

const parser = new edjsParser({
    embed: { useProvidedLength: false },
    quote: { applyAlignment: true },
}, {}, {
    youtube: '<THIS IS YOUTUBE EMBED><%data.embed%><%data.length%><THIS IS FOR TESTING>',
});

const html = parser.parse(testObject);
assert.ok(html.includes("<THIS IS YOUTUBE EMBED>"), "custom embeds resolve");
assert.ok(html.includes('<p class="paragraph"'), "paragraph renders");
assert.ok(html.includes("<table>"), "table renders");

// 3.2.0 features present in the shipped artifact, not just in src/
assert.ok(
    parser.parseBlock({ type: "alert", data: { type: "info", message: "m" } }).includes("cdx-alert"),
    "alert parser ships"
);
assert.equal(
    parser.parseBlock({ type: "paragraph", data: { text: "x" }, tunes: { t: { alignment: "center" } } }),
    '<div style="text-align: center;"><p class="paragraph">x</p></div>',
    "alignment tune ships"
);

console.log("smoke: all bundle assertions passed\n\nHTML:\n" + html);
