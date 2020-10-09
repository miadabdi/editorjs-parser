export default {
    input: "./src/Parser.js",
    output: [{
            file: "./build/Parser.node.js",
            format: "cjs",
            name: "edjsParser",
        },
        {
            file: "./build/Parser.browser.js",
            format: "iife",
            name: "edjsParser",
        },
    ],
};