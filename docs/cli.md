# CLI Reference

## Overview

`html-native` is the command-line interface for the compiler pipeline. It accepts HTML and optional CSS input and generates native UI code for the specified platform.

## How It Works

The CLI (`packages/cli/index.ts`) is a thin orchestrator that wires together the entire compilation pipeline. When you run `html-native convert`, it executes the following stages in order:

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

The CLI is a single module under `packages/cli/` with zero internal subpackages. It depends on every pipeline package via the monorepo workspace:

```
cli
 ├── @html-native/parser              # parseHtml()
 ├── @html-native/css-analyzer        # parseCss(), applyStyles()
 ├── @html-native/semantic-analyzer   # detectSemantics(), createAiDetector()
 ├── @html-native/ir                  # styledNodeToIr()
 ├── @html-native/optimizer           # optimize()
 ├── @html-native/generator-flutter   # generate()
 ├── @html-native/generator-compose   # generate()
 └── @html-native/generator-swiftui   # generate()
```

The binary is registered via the `"bin"` field in `packages/cli/package.json`:

```json
{
  "bin": {
    "html-native": "../../dist/cli/index.js"
  }
}
```

When installed, `html-native` becomes globally available. The CLI uses [commander](https://github.com/tj/commander.js) for argument parsing and exits with code 0 on success or 1 on any error (missing file, parse failure, unknown target, or pipeline exception).

## Installation

```bash
# From npm (when published)
npm install -g html-native-engine

# From source
git clone <repo>
cd html-native-engine
npm install
npm run build
```

## Command: `convert`

Converts HTML/CSS to native UI code.

### Usage

```bash
html-native convert --input <file> --target <platform> [options]
```

### Options

| Option | Alias | Required | Description |
|--------|-------|----------|-------------|
| `--input <path>` | `-i` | Yes | Path to input HTML file |
| `--css <path>` | `-c` | No | Path to input CSS file |
| `--target <platform>` | `-t` | Yes | Target platform: `flutter`, `compose`, or `swiftui` |
| `--output <path>` | `-o` | No | Output file path (prints to stdout if omitted) |
| `--ai-enhance` | | No | Enable Ollama AI-enhanced semantic detection |
| `--ai-model <model>` | | No | Ollama model name (default: `qwen2.5:7b`) |

### Examples

#### Basic Conversion

```bash
# Convert to Flutter, output to file
html-native convert \
  --input index.html \
  --css styles.css \
  --target flutter \
  --output lib/generated.dart

# Convert to Compose, print to stdout
html-native convert \
  --input index.html \
  --css styles.css \
  --target compose

# Convert to SwiftUI with AI enhancement
html-native convert \
  --input index.html \
  --css styles.css \
  --target swiftui \
  --output GeneratedView.swift \
  --ai-enhance
```

#### Platform-Specific

<details>
<summary><b>Flutter</b></summary>

```bash
html-native convert \
  --input page.html \
  --css page.css \
  --target flutter \
  --output lib/widgets/generated_page.dart
```

Generates a Dart file with:
```dart
import 'package:flutter/material.dart';

class GeneratedView extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // ...
  }
}
```
</details>

<details>
<summary><b>Compose</b></summary>

```bash
html-native convert \
  --input page.html \
  --css page.css \
  --target compose \
  --output app/src/main/java/com/example/GeneratedView.kt
```

Generates a Kotlin file with:
```kotlin
import androidx.compose.material3.*

@Composable
fun GeneratedView() {
    // ...
}
```
</details>

<details>
<summary><b>SwiftUI</b></summary>

```bash
html-native convert \
  --input page.html \
  --css page.css \
  --target swiftui \
  --output GeneratedView.swift
```

Generates a Swift file with:
```swift
import SwiftUI

struct GeneratedView: View {
    var body: some View {
        // ...
    }
}
```
</details>

#### CI/CD Integration

```yaml
# GitHub Actions example
jobs:
  generate-ui:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g html-native-engine
      - run: |
          html-native convert \
            --input design/index.html \
            --css design/styles.css \
            --target flutter \
            --output lib/generated/home_page.dart
      - run: flutter build
```

#### Shell Scripting

```bash
#!/bin/bash
# Batch convert all HTML files in a directory

for file in designs/*.html; do
  name=$(basename "$file" .html)
  css="designs/${name}.css"
  
  if [ -f "$css" ]; then
    html-native convert \
      --input "$file" \
      --css "$css" \
      --target flutter \
      --output "lib/generated/${name}_page.dart"
  else
    html-native convert \
      --input "$file" \
      --target flutter \
      --output "lib/generated/${name}_page.dart"
  fi
done
```

#### Automation

```bash
# Watch mode (using entr)
find designs/ -name '*.html' -o -name '*.css' | entr -c html-native convert \
  --input designs/index.html \
  --css designs/styles.css \
  --target flutter \
  --output lib/generated.dart
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Error (file not found, parse failure, unknown target) |

## Error Messages

| Error | Cause |
|-------|-------|
| `File not found: path` | Input file doesn't exist |
| `CSS file not found: path` | CSS file doesn't exist |
| `Unknown target "..."` | Target must be `flutter`, `compose`, or `swiftui` |
| `Error during conversion: ...` | Pipeline error with details |
