# editorjs-parser 2.0.0 — TypeScript Migration Design

Date: 2026-09-08 · Status: approved in session · Supersedes: none

## Goal

Rewrite the library in TypeScript and ship as 2.0.0 with a standard, modern
package shape — **zero behavior change**: the 68-test vitest suite (including
the byte-identical characterization contract) must pass unchanged before and
after.

## Decisions (user-locked)

| Decision | Choice |
|---|---|
| Build tool | **tsup** (replaces rollup + 3 babel devDeps; emits CJS + ESM + IIFE + `.d.ts`) |
| Package layout | **Modernize**: `"type": "module"`, `exports` map with `types`/`import`/`require` conditions, `dist/` artifacts, `files: ["dist"]` |
| Strictness | `strict: true` |
| Tests | Migrated to `.test.ts`, assertions untouched |
| Release | Single commit `2.0.0` + tag + npm publish (established flow) |

## Source structure

- `src/Parser.ts` — `edjsParser` class (logic unchanged)
- `src/parsers.ts` — parser map + `renderNestedList`/`renderNestedChecklist` helpers
- `src/config.ts` — default config (typed)
- `src/utilities.ts` — renamed from `utitlities.js` (typo fixed; internal file, no public impact)
- `src/types.ts` — public types: `EditorJSOutput`, `EditorJSBlock`, `ParserConfig`, `CustomParsers`, `CustomEmbeds`, `ParserFunction`
- `src/index.ts` — entry: `export default` (preserves today's API) + named `edjsParser` + type re-exports
- Old `src/*.js` and `build/` deleted; `dist/` committed in their place (repo convention of committing artifacts continues)

Parser `data` params are typed inline with only the fields each parser reads;
public API stays generic (`data: unknown`-tolerant via `EditorJSBlock`).

## Package shape (package.json)

```jsonc
{
  "version": "2.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist"]
}
```

IIFE bundle (`globalName: "edjsParser"`) ships in `dist/` for CDN consumers;
CDN file paths work on jsdelivr/unpkg regardless of the exports map.

## Build & scripts

- `tsup.config.ts`: entry `src/index.ts`, `format: ["cjs", "esm", "iife"]`,
  `dts: true`, `outDir: "dist"`, `globalName: "edjsParser"`, no minify
  (matches current artifacts).
- `tsconfig.json`: `strict`, `target: ES2018`, `module: ESNext`,
  `moduleResolution: "bundler"`, `noEmit` (tsup emits), `resolveJsonModule`.
- Scripts: `build: "tsup"`, `test: "vitest run"`, `smoke: "node test/smoke.cjs"`,
  `prepublishOnly: "npm test && npm run build"`.
- devDeps after: `typescript`, `tsup`, `vitest` (rollup + babel packages removed).

## Tests

- `test/*.test.js` → `*.test.ts` (vitest native; assertions byte-for-byte identical).
- `test/test.js` → `test/smoke.cjs` (plain `require` of `dist/index.cjs`; the
  `"type": "module"` flip makes `.js` ESM, so the smoke script takes `.cjs`).
- Fixture `testData.json` imported via `resolveJsonModule`.
- Green 68/68 after migration is the no-behavior-change proof.

## Docs

- README: TypeScript section (types ship in-box), CDN URLs → `dist/` paths,
  usage unchanged for package-name consumers.
- AGENTS.md: updated commands/artifact rules; drop the old "package stays
  CJS — never add type:module" rule (2.0.0 is ESM-first with a `.cjs`).
- CHANGELOG 2.0.0 entry with BREAKING section: deep imports
  (`editorjs-parser/build/…`) no longer shipped; package now ESM-first.

## Out of scope (explicitly skipped)

- `engines` field, per-tool payload interfaces for all 16 tools in the public
  API, minified artifacts, CI setup.

## Verification

1. `npx vitest run` → 68/68 before migration (baseline) and after.
2. `npm run build` → `dist/` with `index.js`, `index.cjs`, IIFE, `index.d.ts`.
3. `npx tsc --noEmit` clean.
4. Temp-dir consumer matrix: `npm pack` + install → CJS `require` works, ESM
   `import` works, IIFE defines global `edjsParser` (vm check), and a real
   `tsc` compile consumes our `.d.ts` with autocomplete-level typing.
5. Publish with the established authfile flow; `npm view` confirms 2.0.0.
