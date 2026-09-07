# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2026-09-08

### Changed
- **The library is now written in TypeScript** (`strict` mode) and ships its
  own type declarations — `EditorJSOutput`, `EditorJSBlock`, `ParserConfig`,
  `CustomParsers`, `CustomEmbeds`, `ParserFunction` are exported types.
- Build moved from rollup+babel to [tsup](https://tsup.egoist.dev); artifacts
  now live in `dist/` (`index.js` ESM, `index.cjs` CommonJS, `index.global.js`
  browser IIFE global `edjsParser`, `index.d.ts` types).
- Package is ESM-first (`"type": "module"`) with a modern `exports` map.

### Fixed
- `src/utitlities.js` filename typo — now `src/utilities.ts` (internal file).

### Breaking
- Deep imports such as `require("editorjs-parser/build/Parser.node")` no
  longer exist — import the package root (`require("editorjs-parser")` /
  `import edjsParser from "editorjs-parser"`), which works unchanged.
- Runtime behavior of the parser is **unchanged** — all pre-2.0 output
  assertions pass byte-for-byte.

## [1.8.0] — 2026-09-07

### Added
- Table blocks with `withHeadings: true` now render their first row as a
  `<thead>` row of `<th>` cells (previously the flag was ignored and headings
  rendered as plain `<td>`). Tables without headings render exactly as before.

## [1.7.0] — 2026-09-07

### Added
- Support for the @editorjs/list **v2 save format** (`items:
  [{content, meta, items}]`) with recursive nesting — child lists render
  inside their parent `<li>`. Previously nested items rendered as literal
  `[object Object]`.
- Support for `style: "checklist"` lists — renders the same `cdx-checklist`
  markup as the standalone Checklist tool, with `--checked` modifiers taken
  from each item's `meta.checked`.

### Changed
- List blocks in the legacy flat format (`items: string[]`) render exactly as
  before; only the previously broken nested inputs changed output.

## [1.6.0] — 2026-09-07

### Added
- Support for the **Warning** tool (`warning`) — renders `cdx-warning` markup.
- Support for the **Checklist** tool (`checklist`) — renders `cdx-checklist`
  markup with `--checked` modifiers.
- Support for the **Link tool** (`linkTool`) — renders the tool's card markup
  (`link-tool__*`) with optional image, title, description and hostname anchor.
- Support for the **Attaches** tool (`attaches`) — renders the download card
  (`cdx-attaches__*`) with extension label and human-readable file size.
- Support for the **Personality** tool (`personality`) — renders photo,
  linked name and description (`cdx-personality__*`).

All new markup uses the official editor.js tools' own CSS classes, so
editor.js styles apply to parsed output as-is.

## [1.5.4] — 2026-09-07

### Added
- Vitest test suite (`npm test`) with a characterization contract
  (`test/characterization.test.js`) pinning existing output byte-for-byte —
  the library's backward-compatibility guarantee.
- `AGENTS.md` (with `CLAUDE.md` symlinked to it) documenting project layout,
  commands, and conventions for AI coding agents.
- `npm run smoke` script (the old `npm test` console.log run of the built
  bundle).

### Fixed
- Constructor no longer mutates module-level defaults: constructing
  `new edjsParser(config, customs, embeds)` used to permanently override
  parsers/embed markups for *every other instance in the process*.
- `embed` parser no longer writes a `length` property onto the caller's block
  data object.

## [1.5.3] — 2020-12-25

Package metadata refresh.

## [1.5.2] — 2020-12-25

Partial revert of the 1.5.1 image/simple-image conflict changes; simple-image
support retained via the `data.url` branch of the image parser.

## [1.5.1] — 2020-12-25

Attempted fix for image / simple-image conflicts.

## [1.5.0] — 2020-12-25

### Added
- Support for the simple-image tool (images saved as `data.url`).

## [1.4.3] — 2020-10-18

Documentation updates.

## [1.4.2] — 2020-10-15

Browser build improvements.

## [1.4.1] — 2020-10-15

### Added
- Babel-transpiled ESM and browser builds for older environments.

## [1.4.0] — 2020-10-12

### Added
- Custom embed markups via the third constructor argument.

## [1.3.1] — 2020-10-11

### Added
- `withBackground` image condition class (`img-bg`).

## [1.3.0] — 2020-10-11

### Added
- Quote alignment support (`config.quote.applyAlignment`).

## [1.2.1] — 2020-10-11

Fixes.

## [1.2.0] — 2020-10-09

Early feature release.

[2.0.0]: https://github.com/miadabdi/editorjs-parser/releases/tag/v2.0.0
[1.8.0]: https://github.com/miadabdi/editorjs-parser/releases/tag/v1.8.0
[1.7.0]: https://github.com/miadabdi/editorjs-parser/releases/tag/v1.7.0
[1.6.0]: https://github.com/miadabdi/editorjs-parser/releases/tag/v1.6.0
[1.5.4]: https://github.com/miadabdi/editorjs-parser/releases/tag/v1.5.4
[1.5.3]: https://github.com/miadabdi/editorjs-parser/compare/v1.5.2...1.5.3
[1.5.2]: https://github.com/miadabdi/editorjs-parser/compare/v1.5.1...1.5.2
[1.5.1]: https://github.com/miadabdi/editorjs-parser/compare/v1.5.0...1.5.1
[1.5.0]: https://github.com/miadabdi/editorjs-parser/compare/v1.4.3...1.5.0
[1.4.3]: https://github.com/miadabdi/editorjs-parser/compare/v1.4.2...1.4.3
[1.4.2]: https://github.com/miadabdi/editorjs-parser/compare/v1.4.1...1.4.2
[1.4.1]: https://github.com/miadabdi/editorjs-parser/compare/v1.4.0...1.4.1
[1.4.0]: https://github.com/miadabdi/editorjs-parser/compare/v1.3.1...1.4.0
[1.3.1]: https://github.com/miadabdi/editorjs-parser/compare/v1.3.0...1.3.1
[1.3.0]: https://github.com/miadabdi/editorjs-parser/compare/v1.2.1...1.3.0
[1.2.1]: https://github.com/miadabdi/editorjs-parser/compare/v1.2.0...1.2.1
[1.2.0]: https://github.com/miadabdi/editorjs-parser/commits/1.2.0
