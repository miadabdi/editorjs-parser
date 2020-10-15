import { getBabelOutputPlugin } from '@rollup/plugin-babel';

export default {
    input: "./src/Parser.js",
    output: [{
            file: "./build/Parser.node.js",
            format: "cjs",
            name: "edjsParser",
        },
        {
            file: "./build/Parser.esm.js",
            format: "esm",
            name: "edjsParser",
            plugins: [getBabelOutputPlugin({
                exclude: /node_modules/,
                presets: [
                    "@babel/preset-env",
                ],
                babelrc: false,
                //allowAllFormats: true
            })]
        },
        {
            file: "./build/Parser.browser.js",
            format: "iife",
            name: "edjsParser",
            plugins: [getBabelOutputPlugin({
                exclude: /node_modules/,
                presets: [
                    "@babel/preset-env",
                ],
                babelrc: false,
                allowAllFormats: true
            })]
        },
    ]
};