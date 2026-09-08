# Contributing to editorjs-parser

Thanks for helping! This library converts editor.js saved JSON into HTML —
small, zero runtime dependencies, and pinned by a strong test contract. Keep
it that way.

## Getting started

```bash
npm install
npm test              # vitest — the whole suite must pass
npx tsc --noEmit      # strict typecheck, also must pass
npm run build         # tsup — rebuilds dist/ (committed to the repo)
```

## The rules that matter

1. **Tests first.** Write the failing test, watch it fail, then implement.
   Every behavior change lands with its test in the same commit.
2. **`test/characterization.test.ts` is the backward-compat contract.** It
   pins existing output *byte-for-byte*, quirks included. If your change
   deliberately alters output, update the affected assertion in the same
   commit and explain why in the CHANGELOG.
3. **No runtime dependencies.** Dev-only tooling is fine; the shipped package
   stays dependency-free.
4. **Markup follows the official editor.js tools' own CSS classes**
   (`cdx-*` BEM; the Link tool uses `link-tool__*`). Check the tool's repo
   under the [editor-js org](https://github.com/editor-js) before inventing
   markup — and link the source in your PR description.
5. **No HTML escaping** except the `code` parser. Inline editor.js markup is
   trusted input by design; don't "fix" this.
6. **Parsers never mutate their `data` argument**, and the constructor never
   mutates module-level defaults.
7. **Commit `dist/`** after any `src/` change (`npm run build`), so the repo
   and npm never drift.

## Adding a new block type

Add a parser in `src/parsers.ts` (signature `(data, config) => string`), tests
in a `test/<block>.test.ts` file (RED first), a CHANGELOG entry, README docs,
and a version bump. See `test/newBlocks.test.ts` for the pattern.

## Reporting bugs

Open an issue with: the parser version, the editor.js version, and the exact
block JSON (`{type, data}`) that misbehaves — plus expected vs actual HTML.
Without the block JSON we can't reproduce anything.
