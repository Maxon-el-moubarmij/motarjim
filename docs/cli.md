# CLI Reference

## Overview

`motarjim` is the command-line interface for the compiler pipeline. It accepts HTML and optional CSS input and generates native UI code for the specified platform.

## How It Works

The CLI (`packages/cli/index.ts`) is a thin orchestrator that wires together the entire compilation pipeline. When you run `motarjim convert`, it executes the following stages in order:

```
HTML file  ──▶  readFileSync
                       │
                       ▼
                  parseHtml()          ◀── Stage 1: HTML parsing (parse5)
                       │
                       ▼
CSS file ──▶ parseCss() ──▶ applyStyles()  ◀── Stage 2-3: CSS analysis
                       │
                       ▼
        detectSemantics() / createAiDetector()  ◀── Stage 4: Semantic analysis
                       │
                       ▼
                 styledNodeToIr()      ◀── Stage 5: IR conversion
                       │
                       ▼
                   optimize()          ◀── Stage 6: Optimization
                       │
                       ▼
             generate*(optimized)       ◀── Stage 7: Code generation
                       │
                       ▼
              stdout or writeFileSync
```

### Stage-by-Stage Breakdown

1. **HTML Parsing** — Reads the input HTML file and uses [parse5](https://github.com/inikulin/parse5) to produce an `HtmlNode` AST. Only elements inside `<body>` are retained; `<head>`, doctype, and the outer `<html>` wrapper are stripped.

2. **CSS Analysis** — Parses the CSS file (if provided) with [PostCSS](https://postcss.org/), then recursively walks the HTML tree matching each node against CSS selectors (tag, class, id, universal). Resolved styles are attached to each node, producing `StyledNode[]`.

3. **Semantic Analysis** — Examines tag names, class names, and computed styles to identify UI components (navbars, cards, heroes, modals, etc.) via rule-based heuristics. If `--ai-enhance` is passed, the CLI offloads this stage to a local [Ollama](https://ollama.com) model (default: `qwen2.5:7b`) for AI-powered detection.

4. **IR Conversion** — Transforms the styled tree into a platform-neutral intermediate representation (`UiNode`). CSS properties are converted from kebab-case to camelCase. Semantic hints override inferred node types when confidence exceeds 0.5.

5. **Optimization** — Runs three passes on the IR tree: removes empty text nodes, merges adjacent text nodes, and flattens redundant container wrappers. Optimization happens exactly once at the pipeline level.

6. **Code Generation** — Dispatches to the target platform's generator (Flutter, Compose, or SwiftUI). Each generator implements the `NodeEmitter` interface from `generator-core` to produce syntactically correct platform code.

7. **Output** — Writes the generated code to the specified output file, or prints it to stdout if no `--output` is provided.

### Architecture

The CLI is organized into a command-based architecture under `packages/cli/`:

```
packages/cli/
├── index.ts                # Entry point
├── bin.ts                  # Binary shebang entry
├── src/
│   ├── cli.ts              # Commander program setup
│   ├── types.ts            # Shared type definitions
│   ├── config/
│   │   ├── loader.ts       # Config file loading (cosmiconfig)
│   │   └── defaults.ts     # Smart defaults auto-detection
│   ├── commands/
│   │   ├── convert.ts      # Convert command handler
│   │   ├── init.ts         # Init command handler
│   │   ├── watch.ts        # Watch command handler (chokidar)
│   │   ├── batch.ts        # Batch conversion handler
│   │   ├── validate.ts     # Validation command handler
│   │   ├── explain.ts      # Pipeline explain command
│   │   └── new.ts          # Template scaffolding command
│   ├── services/
│   │   ├── pipeline.ts     # Pipeline orchestration + progress + stats
│   │   ├── wizard.ts       # Interactive prompt wizard (Inquirer)
│   │   ├── error-formatter.ts # Contextual error messages
│   │   ├── templates.ts    # Template definitions & scaffolding
│   │   └── validate-service.ts # HTML/CSS validation logic
│   └── ui/
│       ├── progress.ts     # Pipeline stage spinners (Ora)
│       └── format.ts       # Output formatting utilities
```

It depends on every pipeline package via the monorepo workspace:

```
@motarjim/cli
 ├── @motarjim/parser              # parseHtml()
 ├── @motarjim/css-analyzer        # parseCss(), applyStyles()
 ├── @motarjim/semantic-analyzer   # detectSemantics(), createAiDetector()
 ├── @motarjim/ir                  # styledNodeToIr()
 ├── @motarjim/optimizer           # optimize()
 ├── @motarjim/generator-flutter   # generate()
 ├── @motarjim/generator-compose   # generate()
 └── @motarjim/generator-swiftui   # generate()
```

External dependencies: [commander](https://github.com/tj/commander.js) (CLI framework), [inquirer](https://github.com/SBoudrias/Inquirer.js) (interactive prompts), [chokidar](https://github.com/paulmillr/chokidar) (file watching), [ora](https://github.com/sindresorhus/ora) (progress spinners), [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) (config file loading).

The binary is registered via `packages/cli/package.json`:

```json
{
  "bin": {
    "motarjim": "./bin.ts"
  }
}
```

When installed, `motarjim` becomes globally available (requires `tsx` for TypeScript execution). The CLI uses Commander for argument parsing and exits with code 0 on success or 1 on any error.

## Installation

```bash
# From npm (when published)
npm install -g motarjim

# From source
git clone <repo>
cd motarjim
npm install
npm run build
```

## Commands

### `convert`

Converts HTML to native UI code. Supports smart defaults, config file loading, and interactive wizards.

#### Usage

```bash
motarjim convert [input] [options]
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `input` | Input HTML file (auto-detected if only one `.html` file exists in the current directory) |

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--css <path>` | `-c` | Input CSS file (auto-detected if same name as HTML) |
| `--target <platform>` | `-t` | Target platform: `flutter`, `compose`, `swiftui` (auto-detected from output extension) |
| `--output <path>` | `-o` | Output file path (defaults to `generated/` if omitted) |
| `--ai-enhance` | | Enable Ollama AI-enhanced semantic detection |
| `--ai-model <model>` | | Ollama model name (default: `qwen2.5:7b`) |
| `--dry-run` | | Show detected files, target, and stats without generating code |

#### Priority Order

```
CLI arguments > Config file (motarjim.config.json) > Smart defaults
```

#### Examples

```bash
# Minimal (auto-detect everything)
motarjim convert

# Specify input only
motarjim convert index.html

# Full manual configuration
motarjim convert index.html --css styles.css --target flutter --output lib/generated.dart

# Auto-detect target from output extension
motarjim convert index.html --output home.kt

# Dry run
motarjim convert index.html --dry-run

# With AI enhancement
motarjim convert index.html --ai-enhance --ai-model llama3
```

#### Interactive Mode

When required arguments are omitted and smart defaults can't be determined, the CLI launches an interactive wizard:

```
? Select HTML file: (list of .html files)
? Select CSS file: (list of .css files)
? Select target platform: (flutter / compose / swiftui)
? Output location: (generated/output.dart)
? Enable AI enhancement? (Yes / No)
```

### `init`

Creates a starter project structure with sample files and configuration.

#### Usage

```bash
motarjim init
```

#### Generated Structure

```
motarjim.config.json     # Configuration file
designs/
  index.html                # Sample HTML
  styles.css                # Sample CSS
generated/                  # Output directory
```

### `watch`

Watches HTML/CSS files and auto-regenerates on changes.

#### Usage

```bash
motarjim watch [options]
```

#### Options

| Option | Alias | Description |
|--------|-------|-------------|
| `--input <path>` | `-i` | Input HTML file |
| `--css <path>` | `-c` | Input CSS file |
| `--target <platform>` | `-t` | Target platform |
| `--output <path>` | `-o` | Output file path |
| `--ai-enhance` | | Enable AI enhancement |
| `--ai-model <model>` | | Ollama model name |

#### Example

```bash
motarjim watch --input designs/index.html --css designs/styles.css --target flutter

# Output:
# [23:16:34] Initial build completed
# [23:16:34] Watching for changes...
# [23:16:42] Changed: designs/index.html
# [23:16:42] Generated Flutter code successfully
```

### `batch`

Converts all HTML files in a directory to the target platform.

#### Usage

```bash
motarjim batch [inputDir] [options]
```

#### Arguments

| Argument | Description |
|----------|-------------|
| `inputDir` | Directory containing HTML files (default: `designs/`) |

#### Options

| Option | Description |
|--------|-------------|
| `--target <platform>` | Target platform |
| `--output-dir <path>` | Output directory (default: `generated/`) |
| `--ai-enhance` | Enable AI enhancement |

#### Example

```bash
motarjim batch designs/ --target flutter --output-dir generated/

# Output:
# Converting: home.html...
# Converting: about.html...
# Converting: contact.html...
# Batch complete: 3 succeeded, 0 failed
```

### `validate`

Checks HTML/CSS for issues before conversion.

#### Usage

```bash
motarjim validate <input> [options]
```

#### Examples

```bash
motarjim validate index.html
motarjim validate index.html --css styles.css
```

#### Output

```
Validating: index.html
CSS file:   styles.css

Warnings (3):
⚠ Unsupported CSS selector: :hover
      File: styles.css:42
      Suggestion: HTML-Native does not support :hover.
⚠ Unsupported CSS property: backdrop-filter
      File: styles.css:15
      Suggestion: Use opacity, blur, or shadow instead.
⚠ Missing DOCTYPE declaration
      File: index.html

✓ Validation passed (with warnings)
```

### `explain`

Displays the compilation pipeline architecture with package names and responsibilities.

#### Usage

```bash
motarjim explain
```

#### Output

```
HTML-Native Compilation Pipeline
==================================================
  HTML Parsing      │  Parses HTML using parse5
  CSS Analysis      │  Parses CSS with PostCSS
  Semantic Analysis  │  Detects UI components
  IR Conversion     │  Converts to platform-neutral IR
  Optimization      │  Three optimization passes
  Code Generation   │  Platform-specific code output
==================================================
Output: Flutter (Dart) | Compose (Kotlin) | SwiftUI (Swift)
```

### `new`

Scaffolds a project from a predefined template.

#### Usage

```bash
motarjim new [template]
```

#### Available Templates

| Template | Description |
|----------|-------------|
| `landing-page` | Marketing landing page with hero, features, footer |
| `dashboard` | Admin dashboard with sidebar, stats, table |
| `ecommerce` | Product listing page |
| `portfolio` | Personal portfolio/showcase |
| `blog` | Blog with article cards |

#### Example

```bash
motarjim new landing-page
# Created designs/index.html
# Created designs/styles.css
```

## Configuration File

The CLI supports `motarjim.config.json` for persistent project configuration.

### Example

```json
{
  "input": "designs/index.html",
  "css": "designs/styles.css",
  "target": "flutter",
  "output": "lib/generated/home.dart",
  "aiEnhance": false
}
```

### Priority

```
CLI arguments > Config file > Smart defaults
```

## Output

After a successful conversion, the CLI displays:

```
✔ Parsing HTML
✔ Parsing CSS
✔ Semantic Analysis
✔ IR Conversion
✔ Optimization
✔ Code Generation
Written to lib/generated/home.dart

────────────────────────
  HTML Nodes:              145
  Styled Nodes:            145
  Components Detected:     8
  Optimization Savings:    23%
  Generated Lines:         412
  Target:                  Flutter
  Duration:                0.84s
────────────────────────
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (file not found, parse failure, unknown target, pipeline exception) |

## Error Messages

| Error | Cause |
|-------|-------|
| `File not found: path` | Input file doesn't exist |
| `CSS file not found: path` | CSS file doesn't exist |
| `Unknown target "..."` | Target must be `flutter`, `compose`, or `swiftui` |
| `Unsupported CSS property: ...` | CSS property not supported for native output |
| `Error during conversion: ...` | Pipeline error with details |
