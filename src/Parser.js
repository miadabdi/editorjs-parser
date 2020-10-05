const defaultParsers = require("./parsers");

const defaultConfig = {
    image: {
        withCaption: "figure", // figure or img (figcaption will be used for caption)
        figureClass: "fig-img",
        imgClass: "img",
    },
};

class edjsParser {
    constructor(config = {}, customs = {}) {
        this.config = Object.assign(defaultConfig, config);
        this.parsers = Object.assign(defaultParsers, customs);
    }

    parse(EditorJsObject) {
        const html = EditorJsObject.blocks.map((block) => {
            const markup = this.parseBlock(block);
            if (markup instanceof Error) {
                return ""; // parser for this kind of block doesn't exist
            }
            return markup;
        });
        return html.join("");
    }

    parseBlock(block) {
        try {
            return this.parsers[block.type](block.data);
        } catch (err) {
            return new Error(
                `${block.type} is not supported! Define your own custom function.`
            );
        }
    }
}

module.exports = edjsParser;