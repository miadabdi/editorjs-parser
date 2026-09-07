import { defineConfig } from "tsup";

// esbuild namespace-wraps default exports ({ default: Class }) in CJS and
// IIFE output. Consumers since 1.x do `new (require("editorjs-parser"))()` /
// `new edjsParser()` in the browser, so both formats need the class itself —
// each gets a footer that unwraps it. The ESM format is unaffected.
export default defineConfig([
    {
        entry: ["src/index.ts"],
        format: ["cjs"],
        outDir: "dist",
        target: "es2018",
        clean: true,
        footer: {
            js: ";(function () { var d = module.exports && module.exports.default; if (d) { module.exports = d; module.exports.default = d; } })();",
        },
    },
    {
        entry: ["src/index.ts"],
        format: ["iife"],
        outDir: "dist",
        globalName: "edjsParser",
        target: "es2018",
        footer: {
            js: ";if (edjsParser && edjsParser.default) { edjsParser = edjsParser.default; }",
        },
    },
    {
        entry: ["src/index.ts"],
        format: ["esm"],
        outDir: "dist",
        target: "es2018",
        dts: true,
    },
]);
