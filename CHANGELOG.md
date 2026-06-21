# Changelog

## [Unreleased]

### Fixed

- **Double optimization removed**: Generators no longer call `optimize()` internally.
  Previously, the CLI optimized the IR and then each generator re-optimized it
  silently. Optimization now happens exactly once, at the pipeline level (CLI and
  test helper). If adding a new generate() call site, ensure the IR is pre-optimized.

- **`getValue()` dead code removed**: The fallback `node.properties.value` was never
  set by the IR (it's always deleted in `styledNodeToIr` before `createIrNode`).
  Simplified to `node.value ?? ''`.

### Changed

- **Extracted `@motarjim/generator-core`**: Shared traversal (`walkTree`),
  `NodeEmitter` interface, `countNodes`, `escapeString`/`escapeStringExtra`,
  `findTextLabel`, `getNonTextChildren`. Each platform generator implements
  `NodeEmitter` instead of duplicating the tree-walk switch. 130+ lines of
  duplication removed across the three generators.
