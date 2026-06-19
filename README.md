# html-native-engine

Convert HTML/CSS into native UI code for Flutter, Jetpack Compose, and SwiftUI.

A compiler-style pipeline: HTML/CSS → Parser → AST → Semantic Analyzer → IR → Optimizer → Code Generator.

## Usage

```bash
# Convert HTML to Flutter
html-native convert --input page.html --css styles.css --target flutter

# Convert to Jetpack Compose
html-native convert --input page.html --target compose

# Convert to SwiftUI
html-native convert --input page.html --target swiftui
```

## Architecture

```
HTML/CSS → Parser → AST → Semantic Analyzer → IR → Optimizer → Code Generator
                                                                    ├── Flutter
                                                                    ├── Jetpack Compose
                                                                    └── SwiftUI
```

## Packages

- `parser` - HTML parsing to AST
- `css-analyzer` - CSS parsing and analysis
- `semantic-analyzer` - Semantic structure detection
- `ir` - Intermediate Representation definition
- `optimizer` - IR optimization passes
- `generators/flutter` - Flutter code generation
- `generators/compose` - Jetpack Compose code generation
- `generators/swiftui` - SwiftUI code generation
- `cli` - Command-line interface
- `shared` - Shared types and utilities
