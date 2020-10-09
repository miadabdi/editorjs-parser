import defaultParsers from "./parsers";
import defaultConfig from "./config";
import { mergeDeep } from "./utitlities";

export default class edjsParser {
    constructor(config = {}, customs = {}) {
        this.config = mergeDeep(defaultConfig, config);
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
        if (!this.parsers[block.type]) {
            return new Error(
                `${block.type} is not supported! Define your own custom function.`
            );
        }
        try {
            return this.parsers[block.type](block.data, this.config);
        } catch (err) {
            return err;
        }
    }
}