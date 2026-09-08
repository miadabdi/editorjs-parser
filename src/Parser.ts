import defaultParsers from "./parsers";
import defaultConfig from "./config";
import { mergeDeep, embedMarkups } from "./utilities";
import type {
    CustomEmbeds,
    CustomParsers,
    DeepPartial,
    EditorJSBlock,
    EditorJSOutput,
    ParserConfig,
    ParserFunction,
} from "./types";

export default class edjsParser {
    config: ParserConfig;
    parsers: Record<string, ParserFunction>;

    constructor(
        config: DeepPartial<ParserConfig> = {},
        customs: CustomParsers = {},
        embeds: CustomEmbeds = {}
    ) {
        this.config = mergeDeep(
            defaultConfig as Record<string, any>,
            config as Record<string, any>
        ) as unknown as ParserConfig;
        this.config.embedMarkups = Object.assign({}, embedMarkups, embeds);
        this.parsers = Object.assign({}, defaultParsers, customs);
    }

    parse(EditorJsObject: EditorJSOutput): string {
        if (!EditorJsObject || !Array.isArray(EditorJsObject.blocks)) {
            // fixes #10: callers passing anything but the full editor.js
            // output used to hit a cryptic "reading 'map'" TypeError here
            throw new Error(
                'editorjs-parser: input has no "blocks" array — pass the complete editor.js output ({ time, blocks, version })'
            );
        }
        const html = EditorJsObject.blocks.map((block) => {
            const markup = this.parseBlock(block);
            if (markup instanceof Error) {
                return ""; // parser for this kind of block doesn't exist
            }
            return markup;
        });
        return html.join("");
    }

    parseBlock(block: EditorJSBlock): string | Error {
        if (!this.parsers[block.type]) {
            return new Error(
                `${block.type} is not supported! Define your own custom function.`
            );
        }
        try {
            return this.parsers[block.type](block.data, this.config);
        } catch (err) {
            return err as Error;
        }
    }
}
