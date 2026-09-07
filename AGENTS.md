# AGENTS.md

Guidance for AI coding agents working in this repo. `CLAUDE.md` is a symlink to this file.

## What this is

`editorjs-parser` converts editor.js saved output (`{time, blocks: [{type, data}], version}`) into an HTML string. Zero runtime dependencies. Public API:

```js
const parser = new edjsParser(config, customs, embeds);
parser.parse(editorJsDocument); // → single HTML string
parser.parseBlock({ type, data }); // → HTML string, or Error if unsupported
```

- `config` — deep-merged over `src/config.js` defaults (image, paragraph, code, embed, quote options).
- `customs` — `{ blockType: (data, config) => html }` to add/override parsers per instance.
- `embeds` — `{ serviceName: markup }` templates; `<%data.field%>` placeholders; `<%data.length%>` expands to `width="…" height="…"` when `config.embed.useProvidedLength` is true.

## Layout

- `src/Parser.ts` — `edjsParser` class: config merge, parser dispatch, error handling.
- `src/parsers.ts` — one function per block type, signature `(data, config) => string`. Add new block types here.
- `src/config.ts` — default config.
- `src/utilities.ts` — `mergeDeep`, `sanitizeHtml`, built-in embed markups.
- `src/types.ts` — public TypeScript types, re-exported from `src/index.ts` (the package entry).
- `dist/` — tsup build artifacts (`index.js` ESM, `index.cjs` CommonJS, `index.global.js` browser IIFE exposing global `edjsParser`, `index.d.ts` types). **Committed to the repo.**
- `test/` — vitest suites (TypeScript), `test/smoke.cjs` (bundle smoke script), `testData.json` fixture.
- `tsconfig.json` / `tsup.config.ts` — strict TS, three-format build.

## Commands

- `npm test` — vitest run. Tests import `src/` directly, never the build, so they can't go stale.
- `npm run build` — tsup → rebuilds all `dist/` artifacts. **Run and commit `dist/` after any src change** (repo convention; the build is tracked).
- `npm run smoke` — `node test/smoke.cjs`; requires a fresh build; console-logs the full parse of `testData.json`. Eyeball check of the shipped bundle only — real assertions live in vitest.
- `npx tsc --noEmit` — typecheck; part of the gates before any commit.

## Conventions

- **Tests first.** `test/characterization.test.js` is the backward-compat contract: it pins current output **byte-identical**, quirks included. Any deliberate behavior change updates its assertion in the same commit.
- **Releases:** grouped version bump + `CHANGELOG.md` entry + git tag + `npm publish`. Changelog entry per released capability.
- **New parsers use the official editor.js tool's own CSS classes** (`cdx-*` BEM; the Link tool uses `link-tool__*`). Check the tool's repo under the `editor-js` GitHub org before inventing markup.
- **No HTML escaping except the `code` parser.** editor.js inline markup (`<b>`, `<mark>`, `<a>`…) is trusted input and passes through by design.
- Parsers must never mutate their `data` argument; the constructor must never mutate module-level defaults (other instances share the process).
- Unknown block type → `Error` from `parseBlock`, `""` from `parse`. Don't change this contract.
- The package is ESM-first (`"type": "module"`, exports map) with `index.cjs` for `require()` and an IIFE for browsers. New CommonJS files need the `.cjs` extension. The CJS/IIFE tsup footers unwrap the default export so `new (require(...))()` keeps working — don't remove them.
- Vitest needs no config file. Pin `typescript@^5` — tsup's declaration generation does not support TypeScript 7 yet.

## Quirks that are features (do not "fix" silently)

- `paragraph` output has literal spaces inside the `<p>` tags.
- `delimiter` renders `<br />`.
- Missing image caption renders `alt="undefined"` and a literal `undefined` figcaption.
- Stray double/trailing spaces inside image `class` attributes and embed markup (template collapse of `<%data.length%>`).
- `<blockquote >` trailing space when alignment is not applied.
- The twitter embed template has a duplicate `class` attribute (upstream template, kept verbatim).
