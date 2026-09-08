export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface ImageConfig {
    use: "figure" | "img";
    imgClass: string;
    figureClass: string;
    figCapClass: string;
    path: string;
}

export interface ParserConfig {
    image: ImageConfig;
    paragraph: { pClass: string };
    code: { codeBlockClass: string };
    embed: { useProvidedLength: boolean };
    quote: { applyAlignment: boolean };
    delimiter: { tag: "br" | "hr" };
    embedMarkups: Record<string, string>;
}

export type ParserFunction = (data: any, config: ParserConfig) => string;

export interface CustomParsers {
    [blockType: string]: ParserFunction;
}

export interface CustomEmbeds {
    [service: string]: string;
}

export interface EditorJSBlock {
    type: string;
    data?: any;
    tunes?: Record<string, any>;
}

export interface EditorJSOutput {
    time?: number;
    blocks: EditorJSBlock[];
    version?: string;
}
