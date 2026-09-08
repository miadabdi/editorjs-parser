type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
interface ImageConfig {
    use: "figure" | "img";
    imgClass: string;
    figureClass: string;
    figCapClass: string;
    path: string;
}
interface ParserConfig {
    image: ImageConfig;
    paragraph: {
        pClass: string;
    };
    code: {
        codeBlockClass: string;
    };
    embed: {
        useProvidedLength: boolean;
    };
    quote: {
        applyAlignment: boolean;
    };
    delimiter: {
        tag: "br" | "hr";
    };
    embedMarkups: Record<string, string>;
}
type ParserFunction = (data: any, config: ParserConfig) => string;
interface CustomParsers {
    [blockType: string]: ParserFunction;
}
interface CustomEmbeds {
    [service: string]: string;
}
interface EditorJSBlock {
    type: string;
    data?: any;
    tunes?: Record<string, any>;
}
interface EditorJSOutput {
    time?: number;
    blocks: EditorJSBlock[];
    version?: string;
}

declare class edjsParser {
    config: ParserConfig;
    parsers: Record<string, ParserFunction>;
    constructor(config?: DeepPartial<ParserConfig>, customs?: CustomParsers, embeds?: CustomEmbeds);
    parse(EditorJsObject: EditorJSOutput): string;
    parseBlock(block: EditorJSBlock): string | Error;
}

export { type CustomEmbeds, type CustomParsers, type DeepPartial, type EditorJSBlock, type EditorJSOutput, type ParserConfig, type ParserFunction, edjsParser as default };
