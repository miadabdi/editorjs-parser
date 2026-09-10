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
            let markup = this.parsers[block.type](block.data, this.config);
            const tunes = block.tunes || {};
            // official block tunes, applied generically to any block type:
            if (Array.isArray(tunes.footnotes) && tunes.footnotes.length) {
                // @editorjs/footnotes-tune — texts align with the
                // <sup data-tune="footnotes">N</sup> elements in the text;
                // the tune defines no output markup, so this list is ours
                const items = tunes.footnotes
                    .map((t: string) => `<li class="cdx-footnotes__item">${t}</li>`)
                    .join("");
                markup = `${markup}<ol class="cdx-footnotes">${items}</ol>`;
            }
            if (typeof tunes.textVariant === "string" && tunes.textVariant) {
                // @editorjs/text-variant-tune — the editor wraps the block
                // (footnotes included) in div.cdx-text-variant.--<variant>
                markup = `<div class="cdx-text-variant cdx-text-variant--${tunes.textVariant}">${markup}</div>`;
            }
            const alignmentTune = Object.values(tunes).find(
                (t): t is { alignment: string } =>
                    typeof t === "object" &&
                    t !== null &&
                    typeof (t as Record<string, unknown>).alignment === "string" &&
                    (t as Record<string, unknown>).alignment !== ""
            );
            if (alignmentTune) {
                // third-party alignment tunes (e.g. editor-js-alignment-tune) —
                // the tune key is chosen by the editor config, so any tune value
                // shaped { alignment } is detected; the tune defines no output
                // markup, so this wrapper is ours
                markup = `<div style="text-align: ${alignmentTune.alignment};">${markup}</div>`;
            }
            return markup;
        } catch (err) {
            return err as Error;
        }
    }
}
