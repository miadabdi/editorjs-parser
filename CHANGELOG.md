# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
