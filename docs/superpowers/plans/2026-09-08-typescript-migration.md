# editorjs-parser 2.0.0 — TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite editorjs-parser in TypeScript and ship 2.0.0 with a modern package shape (tsup, `exports` map, bundled `.d.ts`) with **zero behavior change** — proven by the existing 68-test suite passing byte-for-byte unchanged.

**Architecture:** Mechanical language conversion of 4 source files (~250 lines) + new `types.ts`/`index.ts`; toolchain swap (rollup+babel → tsup) producing `dist/` CJS+ESM+IIFE+`.d.ts`; tests migrated to TS with assertions untouched. Each task ends with the full suite green, so the migration can never drift behaviorally.

**Tech Stack:** TypeScript 5 (strict), tsup, vitest 5, Node ≥ 18.

**Spec:** `docs/superpowers/specs/2026-09-08-typescript-migration-design.md`

## Global Constraints

- **Zero runtime dependencies** (devDependencies only: `typescript`, `tsup`, `vitest`).
- **Behavior is frozen**: every existing test assertion stays byte-identical; only the one new API surface (named export from the entry) gets a new failing test first.
- Package artifacts (`dist/`) are **committed to the repo** (existing convention; `build/` is deleted).
- Release flow: commit `2.0.0`, tag `v2.0.0`, publish via the transient authfile pattern (`mktemp` npmrc + `npm publish --userconfig`, removed immediately).
- `"type": "module"` in package.json from Task 2 on — any plain-`.js` CommonJS file must become `.cjs` (only `test/smoke.cjs`).
- No minified artifacts, no `engines` field, no CI (explicitly out of scope per spec).

---

### Task 1: Convert source to TypeScript, add `types.ts` and `index.ts`

**Files:**
- Create: `tsconfig.json`, `src/types.ts`, `src/index.ts`, `test/entry.test.ts`
- Rename + rewrite: `src/utitlities.js` → `src/utilities.ts`, `src/config.js` → `src/config.ts`, `src/parsers.js` → `src/parsers.ts`, `src/Parser.js` → `src/Parser.ts` (delete the `.js` originals)
- Modify: import specifiers in `test/*.test.js` (`"../src/Parser.js"` → `"../src/Parser"`)

**Interfaces:**
- Consumes: nothing new (existing runtime behavior, existing tests).
- Produces: `edjsParser` class (default + named export from `src/index.ts`), public types `EditorJSOutput`, `EditorJSBlock`, `ParserConfig`, `CustomParsers`, `CustomEmbeds`, `ParserFunction`, `DeepPartial` — all defined in `src/types.ts` and re-exported from `src/index.ts`. Later tasks import `edjsParser` from `src/index.ts` (tsup entry) and rely on these exact type names.

- [ ] **Step 1: Write the failing test for the new entry module**

Create `test/entry.test.ts` (vitest runs TS natively; this is the only NEW API surface — default and named export must be the same class):

```ts
import { describe, it, expect } from "vitest";
import edjsParserDefault, { edjsParser } from "../src/index";

describe("entry module", () => {
    it("exports the parser as default and as a named export", () => {
        expect(edjsParserDefault).toBe(edjsParser);
    });

    it("works through the entry", () => {
        expect(new edjsParser().parseBlock({ type: "delimiter", data: {} })).toBe("<br />");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run test/entry.test.ts`
Expected: FAIL — cannot resolve `../src/index` (module does not exist).

- [ ] **Step 3: Install TypeScript**

```bash
npm install --save-dev typescript
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2018", "DOM"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src", "test"]
}
```

(`DOM` lib is only for the `URL` global used by the linkTool parser — the package runs in both Node and browsers.)

- [ ] **Step 5: Create `src/types.ts`**

```ts
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
```

- [ ] **Step 6: Create `src/config.ts`** (typed; no `embedMarkups` — the constructor installs it)

```ts
import type { ParserConfig } from "./types";

const defaultConfig: Omit<ParserConfig, "embedMarkups"> = {
    image: {
        use: "figure", // figure or img (figcaption will be used for caption of figure)
        imgClass: "img",
        figureClass: "fig-img",
        figCapClass: "fig-cap",
        path: "absolute",
    },
    paragraph: {
        pClass: "paragraph",
    },
    code: {
        codeBlockClass: "code-block",
    },
    embed: {
        useProvidedLength: false,
        // set to true if you want the returned width and height of editorjs to be applied
        // NOTE: sometimes source site overrides the lengths so it does not work 100%
    },
    quote: {
        applyAlignment: false,
        // if set to true blockquote element will have text-align css property set
    },
};

export default defaultConfig;
```

- [ ] **Step 7: Create `src/utilities.ts`** (rename fixes the `utitlities` typo; content identical except types)

```ts
export const isObject = function (item: unknown): item is Record<string, any> {
    return !!item && typeof item === "object" && !Array.isArray(item);
};

export const mergeDeep = function (
    target: Record<string, any>,
    source: Record<string, any>
): Record<string, any> {
    const output: Record<string, any> = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach((key) => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, {
                        [key]: source[key],
                    });
                else output[key] = mergeDeep(target[key], source[key]);
            } else {
                Object.assign(output, {
                    [key]: source[key],
                });
            }
        });
    }
    return output;
};

export const sanitizeHtml = function (markup: string): string {
    markup = markup.replace(/&/g, "&amp;");
    markup = markup.replace(/</g, "&lt;");
    markup = markup.replace(/>/g, "&gt;");
    return markup;
};

export const embedMarkups: Record<string, string> = {
    youtube: `<div class="embed"><iframe class="embed-youtube" frameborder="0" src="<%data.embed%>" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen <%data.length%>></iframe></div>`,

    twitter: `<blockquote class="twitter-tweet" class="embed-twitter" <%data.length%>><a href="<%data.source%>"></a></blockquote> <script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>`,

    instagram: `<blockquote class="instagram-media" <%data.length%>><a href="<%data.embed%>/captioned"></a></blockquote><script async defer src="//www.instagram.com/embed.js"></script>`,

    codepen: `<div class="embed"><iframe <%data.length%> scrolling="no" src="<%data.embed%>" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true"></iframe></div>`,

    defaultMarkup: `<div class="embed"><iframe src="<%data.embed%>" <%data.length%> class="embed-unknown" allowfullscreen="true" frameborder="0" ></iframe></div>`,
};
```

- [ ] **Step 8: Create `src/parsers.ts`** — same logic, same strings, typed params. The local `renderNestedList`/`renderNestedChecklist` helpers and `ListItemV2` interface carry the list v2 shape.

```ts
import { sanitizeHtml } from "./utilities";
import type { ParserConfig, ParserFunction } from "./types";

interface ListItemV2 {
    content: string;
    meta?: { checked?: boolean; start?: number; counterType?: string };
    items?: ListItemV2[];
}

function renderNestedList(items: ListItemV2[], tag: "ol" | "ul"): string {
    const lis = items
        .map((item) => {
            const children =
                item.items && item.items.length
                    ? renderNestedList(item.items, tag)
                    : "";
            return `<li>${item.content}${children}</li>`;
        })
        .join("");
    return `<${tag}>${lis}</${tag}>`;
}

function renderNestedChecklist(items: ListItemV2[]): string {
    const divs = items
        .map((item) => {
            const checked =
                item.meta && item.meta.checked
                    ? " cdx-checklist__item--checked"
                    : "";
            const children =
                item.items && item.items.length
                    ? renderNestedChecklist(item.items)
                    : "";
            return `<div class="cdx-checklist__item${checked}">${item.content}${children}</div>`;
        })
        .join("");
    return `<div class="cdx-checklist">${divs}</div>`;
}

const parsers: Record<string, ParserFunction> = {
    paragraph: function (data: { text: string }, config: ParserConfig) {
        return `<p class="${config.paragraph.pClass}"> ${data.text} </p>`;
    },

    header: function (data: { text: string; level: number }) {
        return `<h${data.level}>${data.text}</h${data.level}>`;
    },

    list: function (data: {
        style?: string;
        items?: (string | ListItemV2)[];
    }) {
        const items = data.items || [];

        // legacy format ({style, items: string[]}) — output must stay byte-identical
        if (typeof items[0] === "string" || items.length === 0) {
            const type = data.style === "ordered" ? "ol" : "ul";
            const legacyItems = items.reduce<string>(
                (acc, item) => acc + `<li>${item as string}</li>`,
                ""
            );
            return `<${type}>${legacyItems}</${type}>`;
        }

        // @editorjs/list v2 ({style, items: [{content, meta, items}]})
        if (data.style === "checklist") {
            return renderNestedChecklist(items as ListItemV2[]);
        }
        return renderNestedList(
            items as ListItemV2[],
            data.style === "ordered" ? "ol" : "ul"
        );
    },

    quote: function (
        data: { text: string; caption: string; alignment?: string },
        config: ParserConfig
    ) {
        let alignment = "";
        if (config.quote.applyAlignment) {
            alignment = `style="text-align: ${data.alignment};"`;
        }
        return `<blockquote ${alignment}><p>${data.text}</p><cite>${data.caption}</cite></blockquote>`;
    },

    table: function (data: { content: string[][]; withHeadings?: boolean }) {
        const rowToTr = (row: string[], tag: "td" | "th") =>
            `<tr>${row.reduce((acc, cell) => acc + `<${tag}>${cell}</${tag}>`, "")}</tr>`;
        if (data.withHeadings && data.content.length) {
            const [head, ...body] = data.content;
            return `<table><thead>${rowToTr(head, "th")}</thead><tbody>${body
                .map((row) => rowToTr(row, "td"))
                .join("")}</tbody></table>`;
        }
        const rows = data.content.map((row) => rowToTr(row, "td"));
        return `<table><tbody>${rows.join("")}</tbody></table>`;
    },

    image: function (
        data: {
            url?: string;
            file?: { url: string; [key: string]: any };
            caption?: string;
            stretched?: boolean;
            withBorder?: boolean;
            withBackground?: boolean;
        },
        config: ParserConfig
    ) {
        const imageConditions = `${data.stretched ? "img-fullwidth" : ""} ${
            data.withBorder ? "img-border" : ""
        } ${data.withBackground ? "img-bg" : ""}`;
        const imgClass = config.image.imgClass || "";
        let imageSrc: string | undefined;

        if (data.url) {
            // simple-image was used and the image probably is not uploaded to this server
            // therefore, we use the absolute path provided in data.url
            // so, config.image.path property is useless in this case!
            imageSrc = data.url;
        } else if (config.image.path === "absolute") {
            imageSrc = data.file!.url;
        } else {
            imageSrc = config.image.path.replace(
                /<(.+)>/,
                (match, p1) => data.file![p1]
            );
        }

        if (config.image.use === "img") {
            return `<img class="${imageConditions} ${imgClass}" src="${imageSrc}" alt="${data.caption}">`;
        } else if (config.image.use === "figure") {
            const figureClass = config.image.figureClass || "";
            const figCapClass = config.image.figCapClass || "";

            return `<figure class="${figureClass}"><img class="${imgClass} ${imageConditions}" src="${imageSrc}" alt="${data.caption}"><figcaption class="${figCapClass}">${data.caption}</figcaption></figure>`;
        }
        return undefined as unknown as string; // unreachable with valid config — preserves legacy "bad use → undefined" behavior
    },

    code: function (data: { code: string }, config: ParserConfig) {
        const markup = sanitizeHtml(data.code);
        return `<pre><code class="${config.code.codeBlockClass}">${markup}</code></pre>`;
    },

    raw: function (data: { html: string }) {
        return data.html;
    },

    delimiter: function () {
        return "<br />";
    },

    warning: function (data: { title: string; message: string }) {
        return `<div class="cdx-warning"><div class="cdx-warning__title">${data.title}</div><div class="cdx-warning__message">${data.message}</div></div>`;
    },

    checklist: function (data: {
        items: { text: string; checked: boolean }[];
    }) {
        const items = data.items.reduce(
            (acc, item) =>
                acc +
                `<div class="cdx-checklist__item${item.checked ? " cdx-checklist__item--checked" : ""}">${item.text}</div>`,
            ""
        );
        return `<div class="cdx-checklist">${items}</div>`;
    },

    linkTool: function (data: {
        link: string;
        meta?: {
            title?: string;
            description?: string;
            image?: { url?: string };
        };
    }) {
        const meta = data.meta || {};
        const image =
            meta.image && meta.image.url
                ? `<div class="link-tool__image" style="background-image: url('${meta.image.url}')"></div>`
                : "";
        const title = meta.title ? `<div class="link-tool__title">${meta.title}</div>` : "";
        const description = meta.description
            ? `<p class="link-tool__description">${meta.description}</p>`
            : "";
        let domain = data.link;
        try {
            domain = new URL(data.link).hostname;
        } catch (err) {
            // keep the raw link as the anchor text
        }
        return `<a class="link-tool__content link-tool__content--rendered" href="${data.link}" target="_blank" rel="nofollow noindex noreferrer">${image}${title}${description}<span class="link-tool__anchor">${domain}</span></a>`;
    },

    attaches: function (data: {
        title: string;
        file?: { url?: string; size?: number; name?: string; extension?: string };
    }) {
        const file = data.file || {};
        let size = "";
        if (file.size) {
            const isMiB = Math.log10(+file.size) >= 6;
            const value = isMiB ? file.size / 2 ** 20 : file.size / 2 ** 10;
            size = `<span class="cdx-attaches__size">${value.toFixed(1)} ${isMiB ? "MiB" : "KiB"}</span>`;
        }
        const fileIcon = `<div class="cdx-attaches__file-icon"><div class="cdx-attaches__file-icon-background">${
            file.extension ? `<div class="cdx-attaches__file-icon-label">${file.extension}</div>` : ""
        }</div></div>`;
        return `<div class="cdx-attaches cdx-attaches--with-file"><a class="cdx-attaches__download-button" href="${file.url}" target="_blank"></a><div class="cdx-attaches__file-info">${fileIcon}<div class="cdx-attaches__title">${data.title}</div>${size}</div></div>`;
    },

    personality: function (data: {
        name: string;
        description: string;
        link: string;
        photo: string;
    }) {
        return `<div class="cdx-personality"><div class="cdx-personality__photo" style="background-image: url('${data.photo}');"></div><a class="cdx-personality__name" href="${data.link}">${data.name}</a><div class="cdx-personality__description">${data.description}</div></div>`;
    },

    embed: function (
        data: {
            service: string;
            source: string;
            embed: string;
            width: number;
            height: number;
            caption?: string;
        },
        config: ParserConfig
    ) {
        data = { ...data }; // work on a copy — never mutate the caller's block data
        const dataAny = data as any;
        if (config.embed.useProvidedLength) {
            dataAny.length = `width="${data.width}" height="${data.height}"`;
        } else {
            dataAny.length = "";
        }
        const regex = /<%data\.(.+?)%>/gm;
        if (config.embedMarkups[data.service]) {
            return config.embedMarkups[data.service].replace(
                regex,
                (match, p1) => dataAny[p1]
            );
        } else {
            return config.embedMarkups["defaultMarkup"].replace(
                regex,
                (match, p1) => dataAny[p1]
            );
        }
    },
};

export default parsers;
```

- [ ] **Step 9: Create `src/Parser.ts`**

```ts
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
```

- [ ] **Step 10: Create `src/index.ts`** (default export preserved; named export + types are additive)

```ts
import edjsParser from "./Parser";

export { edjsParser };
export type {
    CustomEmbeds,
    CustomParsers,
    EditorJSBlock,
    EditorJSOutput,
    ParserConfig,
    ParserFunction,
} from "./types";
export default edjsParser;
```

- [ ] **Step 11: Delete the old JS sources and fix test imports**

```bash
git rm src/Parser.js src/parsers.js src/config.js src/utitlities.js
```

In all 7 `test/*.test.js` files change `import edjsParser from "../src/Parser.js";` to `import edjsParser from "../src/Parser";` (one line per file; assertions untouched).

- [ ] **Step 12: Verify entry test passes and full suite stays green**

Run: `npx vitest run`
Expected: **70 passed** (68 existing + 2 new entry tests) — proves zero behavior change.

- [ ] **Step 13: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output, exit 0. (`test/*.test.js` still JS — typechecked loosely; TS conversion is Task 3.)

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "refactor: migrate src to TypeScript (strict), add types.ts and index.ts entry"
```

---

### Task 2: tsup build + modern package layout

**Files:**
- Create: `tsup.config.ts`, `test/smoke.cjs`
- Modify: `package.json` (version fields below listed at their final 2.0.0 values only in Task 4 — this task sets layout fields), `README.md` (CDN URLs only)
- Delete: `rollup.config.js`, `test/test.js`, `build/` directory

**Interfaces:**
- Consumes: `src/index.ts` default+named exports from Task 1.
- Produces: `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts`, plus an IIFE bundle exposing global `edjsParser` (tsup names it — check `ls dist/`; typically `index.global.js`). Later tasks reference these exact paths.

- [ ] **Step 1: Swap build tooling**

```bash
npm install --save-dev tsup
npm uninstall rollup @rollup/plugin-babel @babel/core @babel/preset-env
git rm rollup.config.js
```

- [ ] **Step 2: Create `tsup.config.ts`**

```ts
import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["cjs", "esm", "iife"],
    dts: true,
    outDir: "dist",
    globalName: "edjsParser",
    target: "es2018",
    clean: true,
});
```

- [ ] **Step 3: Update `package.json`** — set these fields (leave `version` at 1.8.0 until Task 4):

```jsonc
{
  // delete the "directories" key
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "test": "vitest run",
    "smoke": "node test/smoke.cjs",
    "build": "tsup",
    "prepublishOnly": "npm test && npm run build"
  }
}
```

- [ ] **Step 4: Move the smoke script to CommonJS**

`"type": "module"` makes `.js` ESM, so the old `test/test.js` (which uses `require`) becomes `test/smoke.cjs`:

```js
const testObject = require("./testData.json");
const edjsParser = require("../dist/index.cjs");

const parser = new edjsParser({
    embed: { useProvidedLength: false },
    quote: { applyAlignment: true },
}, {}, {
    youtube: '<THIS IS YOUTUBE EMBED><%data.embed%><%data.length%><THIS IS FOR TESTING>',
});
const html = parser.parse(testObject);
console.log("HTML:\n" + html);
```

```bash
git rm test/test.js
```

- [ ] **Step 5: Remove the old build output and build the new one**

```bash
git rm -r build/
npm run build
ls dist/
```
Expected: `index.js`, `index.cjs`, `index.d.ts`, and the IIFE file (note its exact name for Step 7 and README).

- [ ] **Step 6: Verify all artifacts**

```bash
node -e "const P=require('./dist/index.cjs'); console.log(new P().parseBlock({type:'delimiter',data:{}}))"
node --input-type=module -e "import P from './dist/index.js'; console.log(new P().parseBlock({type:'warning',data:{title:'T',message:'M'}}).slice(0,30))"
node -e "const fs=require('fs'),vm=require('vm');const ctx={};vm.runInNewContext(fs.readFileSync('dist/index.global.js','utf8'),ctx);console.log(typeof ctx.edjsParser)"
grep -c "cdx-warning" dist/index.d.ts || true
npm run smoke
```
Expected: `<br />`; warning markup; `function`; d.ts mentions parser types; smoke prints full HTML.

- [ ] **Step 7: Update README CDN URLs**

Replace the two `cdn.jsdelivr.net/npm/editorjs-parser@1/build/Parser.*.js` lines with the new paths (adjust the IIFE filename to the actual `dist/` name):

```markdown
- https://cdn.jsdelivr.net/npm/editorjs-parser@2/dist/index.cjs (Node only)
- https://cdn.jsdelivr.net/npm/editorjs-parser@2/dist/index.global.js (Browser only)
```

- [ ] **Step 8: Full suite still green**

Run: `npx vitest run`
Expected: 70 passed (tests target `src/`, unaffected by packaging).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "build: replace rollup+babel with tsup, modern exports/types package layout"
```

---

### Task 3: Migrate the test suites to TypeScript

**Files:**
- Rename: all 7 `test/*.test.js` → `test/*.test.ts` (assertions byte-identical)
- `test/entry.test.ts` and `test/smoke.cjs` are already in their final form

**Interfaces:**
- Consumes: `edjsParser` + types from `src/index.ts` / `src/Parser.ts` (Task 1).
- Produces: nothing consumed later; this task closes the "whole project in TypeScript" requirement.

- [ ] **Step 1: Rename the suites and fix imports**

```bash
for f in bugfixes characterization extensions fullDocument list newBlocks table; do git mv "test/$f.test.js" "test/$f.test.ts"; done
```

In each renamed file change `import edjsParser from "../src/Parser";` to `import edjsParser from "../src/Parser";` — already correct from Task 1 Step 11; no other changes. Assertions, strings, and structure stay exactly as they are (they are the frozen contract). If `tsc` flags a specific line (e.g. an `any`-tolerant object literal), annotate with the exported types rather than loosening the assertion, e.g.:

```ts
import type { EditorJSOutput } from "../src/types";
```

- [ ] **Step 2: Verify the suite is green and typechecks**

```bash
npx vitest run
npx tsc --noEmit
```
Expected: 70 passed; typecheck clean.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "test: migrate suites to TypeScript"
```

---

### Task 4: Docs, version 2.0.0, verification matrix, release

**Files:**
- Modify: `README.md`, `AGENTS.md`, `CHANGELOG.md`, `package.json` (version → 2.0.0)
- Regenerate: `dist/` (committed)

**Interfaces:**
- Consumes: everything from Tasks 1–3.
- Produces: published `editorjs-parser@2.0.0` on npm, tag `v2.0.0`.

- [ ] **Step 1: README TypeScript + usage section**

Add after the Installation section:

```markdown
## TypeScript

The package is written in TypeScript and ships its own type declarations — no
`@types` install needed. Public types: `edjsParser`, `EditorJSOutput`,
`EditorJSBlock`, `ParserConfig`, `CustomParsers`, `CustomEmbeds`.

\`\`\`typescript
import edjsParser, { type EditorJSOutput } from "editorjs-parser";
const parser = new edjsParser();
const html: string = parser.parse(output satisfies EditorJSOutput);
\`\`\`
```

Also update the Usage `require`/import examples if they reference old paths (they use the package name — unchanged).

- [ ] **Step 2: Update AGENTS.md sections**

- Layout: `src/` files now `.ts` (+ `types.ts`, `index.ts`); `utilities.ts` (typo fixed); `dist/` replaces `build/` (committed dist artifacts).
- Commands: `npm run build` → tsup; `npm run smoke` → `node test/smoke.cjs`.
- Conventions: REPLACE the line "The package is CommonJS (`main: build/Parser.node.js`). Do **not** add `"type": "module"`" with: "The package is ESM-first (`"type": "module"`, exports map) with a `.cjs` for `require`. New CommonJS files need the `.cjs` extension."
- Keep the rest (characterization contract, quirks, cdx-* convention) unchanged.

- [ ] **Step 3: CHANGELOG 2.0.0 entry** (top of file, above `[1.8.0]`)

```markdown
## [2.0.0] — 2026-09-08

### Changed
- **The library is now written in TypeScript** (`strict` mode) and ships its
  own type declarations — `EditorJSOutput`, `EditorJSBlock`, `ParserConfig`,
  `CustomParsers`, `CustomEmbeds` are exported from the package root.
- Build moved from rollup+babel to [tsup](https://tsup.egoist.dev); artifacts
  now live in `dist/` (`index.js` ESM, `index.cjs` CommonJS, browser IIFE
  global `edjsParser`, `index.d.ts` types).
- Package is ESM-first (`"type": "module"`) with a modern `exports` map.

### Added
- Named export `edjsParser` alongside the default export.

### Fixed
- `src/utitlities.js` typo — now `src/utilities.ts` (internal file).

### Breaking
- Deep imports such as `require("editorjs-parser/build/Parser.node")` no
  longer exist — import the package root (`require("editorjs-parser")` /
  `import edjsParser from "editorjs-parser"`), which works unchanged.
- Runtime behavior of the parser is **unchanged** — all 68 pre-2.0 output
  assertions pass byte-for-byte.
```

Add the link reference: `[2.0.0]: https://github.com/miadabdi/editorjs-parser/releases/tag/v2.0.0` (top of the link list).

- [ ] **Step 4: Version bump + fresh build**

In `package.json`: `"version": "2.0.0"`. Then:

```bash
npm run build
npx vitest run
npx tsc --noEmit
```
Expected: build clean; 70 passed; typecheck clean.

- [ ] **Step 5: Consumer verification matrix** (temp dir, never inside the repo)

```bash
npm pack
TMPD=$(mktemp -d /tmp/edjs2.XXXXXX) && cd "$TMPD" && npm init -y >/dev/null && npm install --no-audit --no-fund /home/miad/projects/editorjs-parser/editorjs-parser-2.0.0.tgz
node -e "const P=require('editorjs-parser'); console.log('cjs ok:', new P().parseBlock({type:'delimiter',data:{}}))"
node --input-type=module -e "import P from 'editorjs-parser'; console.log('esm ok:', typeof P)"
node -e "const fs=require('fs'),vm=require('vm'),p=require('path');const f=p.join(p.dirname(require.resolve('editorjs-parser/package.json')),'..');"
```

For the IIFE + TS-consumer checks, create `$TMPD/ts-check/` with:

```json
// ts-check/package.json
{ "name": "ts-check", "version": "1.0.0", "type": "module" }
```

```json
// ts-check/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020", "module": "ESNext", "moduleResolution": "bundler",
    "strict": true, "noEmit": true, "skipLibCheck": true
  },
  "include": ["."]
}
```

```ts
// ts-check/check.ts — proves types resolve and autocomplete-relevant members exist
import edjsParser, { edjsParser as Named, type EditorJSOutput, type ParserConfig } from "editorjs-parser";

const parser = new edjsParser();
const out: EditorJSOutput = { blocks: [{ type: "paragraph", data: { text: "hi" } }] };
const html: string = parser.parse(out);
const cfg: DeepPartialTest = {};
type DeepPartialTest = Partial<ParserConfig>;
console.log(edjsParser === Named, html.length > 0, typeof cfg);
```

```bash
cd "$TMPD/ts-check" && npm install --no-audit --no-fund "$TMPD/node_modules/editorjs-parser" >/dev/null 2>&1 || npm i --no-audit --no-fund /home/miad/projects/editorjs-parser/editorjs-parser-2.0.0.tgz
npx --yes typescript@5 tsc --noEmit
```
Expected: `cjs ok: <br />`, `esm ok: function`, tsc exits 0. Clean up: `rm -rf "$TMPD"` and delete the `.tgz` from the repo root.

- [ ] **Step 6: Commit, tag, publish**

```bash
git add -A
git commit -m "2.0.0"
git tag v2.0.0
```

Publish with the transient authfile pattern (token passed by the user in-session; never written to any repo file):

```bash
AUTHFILE=$(mktemp /tmp/edjsnpm.XXXXXX)
printf '//registry.npmjs.org/:_authToken=<TOKEN>\nregistry=https://registry.npmjs.org/\n' > "$AUTHFILE"
npm publish --access public --userconfig "$AUTHFILE"
rm -f "$AUTHFILE"
npm view editorjs-parser version
```
Expected: `+ editorjs-parser@2.0.0`, then `2.0.0` from `npm view`.

---

## Self-Review (done at plan time)

- **Spec coverage:** source conversion + types (Task 1), tsup/packaging/layout (Task 2), tests TS (Task 3), docs/changelog/release/verification matrix (Task 4) — all spec sections mapped. `files: ["dist"]`, committed dist, deleted `build/`, `smoke.cjs`, typo rename — covered.
- **Placeholders:** none — every code block is complete file content or an exact command.
- **Type consistency:** `ParserFunction(data: any, config: ParserConfig) => string` used identically in `types.ts`, `parsers.ts`, `Parser.ts`; `DeepPartial<ParserConfig>` is the ctor arg; test files import only `edjsParser` (+ `EditorJSOutput` in the TS-check). The `image` parser's unreachable `undefined` return preserves the pre-2.0 legacy behavior documented in characterization (bad `use` config → undefined).
