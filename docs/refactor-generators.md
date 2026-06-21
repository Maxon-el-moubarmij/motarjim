# Generator Refactor Plan

## Current Problems

### 1. Duplicate style data on UiNode
`properties` (raw CSS strings from `extractProps()`) and `computed` (typed from `computeStyle()`) carry overlapping data. Flutter merges both via `formatProps()`.

### 2. Flutter infers styles at generation time
`formatProps()` regex-parses `"16px"` → `16` instead of using the already-parsed `computed` fields. This violates the rule that generators must NOT infer styles.

### 3. Compose / SwiftUI ignore styles entirely
`emitContainer` in both generators emits bare structural code with zero styling — no padding, margin, color, border, or flex properties.

### 4. Hardcoded widget names
Each emitter's dispatch logic (Column/Row/Container/etc.) is hardcoded. The existing widget engine (`generator-core/widget-engine.ts`) computes optimal platform-specific widget choices but is never called.

### 5. Static import strings
Each generator prepends a hardcoded import block. Plugins that add new widget types cannot extend imports.

---

## Architecture: Before vs After

### Before (current)

```
styledNodeToIr()
  ├─ extractProps() → node.properties (CSS strings)
  ├─ computeStyle() → node.computed (typed values)
  └─ children → recursive

flutter/generate():
  └─ walkTree() → flutterEmitter
       └─ formatProps() ← merges properties + computed
                            regex-parses "16px" → 16   ← BAD

compose/generate():
  └─ walkTree() → composeEmitter   ← no styling at all

swiftui/generate():
  └─ walkTree() → swiftuiEmitter   ← no styling at all
```

### After (target)

```
styledNodeToIr()
  ├─ computeStyle() → node.computed (ONLY source of style truth)
  ├─ node.properties → src, alt, href, value only  (no CSS)
  └─ children → recursive

generator-core / styles.ts (shared:
  ├─ lowerStyle(node, platform) → platform style code
  ├─ ContainerStyle, TextStyle, ButtonStyle types
  └─ ImportCollector → tracks used widgets → minimal imports)

flutter/generate():
  ├─ ImportCollector → import statement
  ├─ walkTree() → flutterEmitter
  │    ├─ lowerStyle(node, 'flutter') → EdgeInsets / BoxDecoration
  │    └─ selectWidget(node, 'flutter') → correct widget name
  └─ wrap in scaffold

compose/generate():
  ├─ ImportCollector → import statement
  ├─ walkTree() → composeEmitter
  │    ├─ lowerStyle(node, 'compose') → Modifier chains
  │    └─ selectWidget(node, 'compose') → correct widget name
  └─ wrap in composable

swiftui/generate():
  ├─ ImportCollector → import statement
  ├─ walkTree() → swiftuiEmitter
  │    ├─ lowerStyle(node, 'swiftui') → ViewModifier chains
  │    └─ selectWidget(node, 'swiftui') → correct widget name
  └─ wrap in View
```

---

## Step-by-step Implementation

### Step 1: Clean up IR — remove `extractProps()` CSS duplication

**File: `packages/ir/index.ts`**

Current `extractProps()` copies CSS values into `node.properties`:
```typescript
function extractProps(styled: StyledNode): Record<string, unknown> {
  if (s['padding']) props.padding = s['padding'];     // raw "16px"
  if (s['margin']) props.margin = s['margin'];          // raw "8px"
  if (s['color']) props.color = s['color'];             // raw "#333"
  // ... 13 more CSS properties
}
```

Change: `node.properties` should carry **only IR-level attributes** (src, alt, href, value). All CSS/layout data lives in `node.computed` (already parsed by `computeStyle()`).

Remove CSS lines from `extractProps()`:
```typescript
function extractProps(styled: StyledNode): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  // REMOVED: padding, margin, gap, width, height, min-width, max-width,
  //          font-size, font-weight, line-height, text-align, color,
  //          background, border, border-radius, box-shadow, position

  if (styled.node.value) props.value = styled.node.value;

  const srcAttr = styled.node.attributes.find(a => a.name === 'src');
  if (srcAttr) props.src = srcAttr.value;

  const altAttr = styled.node.attributes.find(a => a.name === 'alt');
  if (altAttr) props.alt = altAttr.value;

  const hrefAttr = styled.node.attributes.find(a => a.name === 'href');
  if (hrefAttr) props.href = hrefAttr.value;

  const htmlValueAttr = styled.node.attributes.find(a => a.name === 'value');
  if (htmlValueAttr && styled.node.tagName === 'input') {
    props.value = htmlValueAttr.value;
  }

  return props;
}
```

The `computeStyle()` call at line 51 stays — `node.computed` now becomes the exclusive style data source for generators.

### Step 2: Add typed style lowering to `generator-core`

**New file: `packages/generator-core/src/styles/common.ts`**

```typescript
// ── Style interface that generators consume ──

export interface LoweredContainerStyle {
  hasDecoration: boolean;       // background, border, shadow
  padding?: string;
  margin?: string;              // only used by Flutter (margin on Container)
  alignment?: string;
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  flexGrow?: number;
  gap?: string;
  background?: string;
  borderRadius?: string;
  border?: string;
  shadow?: string;
}

export interface LoweredTextStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  textAlign?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontFamily?: string;
}

export interface LoweredButtonStyle {
  // most styling is on the Container wrapping it
}

export interface StyleLoweringResult {
  container?: LoweredContainerStyle;
  text?: LoweredTextStyle;
  decoration?: string;       // platform-specific decoration code
}
```

**New file: `packages/generator-core/src/styles/flutter.ts`**

```typescript
import type { ComputedStyle } from '@motarjim/shared';
import type { LoweredContainerStyle, LoweredTextStyle } from './common.js';

export function lowerFlutterContainerStyle(computed: ComputedStyle): LoweredContainerStyle {
  const s: LoweredContainerStyle = {};
  // ── Padding ──
  if (computed.paddingTop !== undefined && computed.paddingBottom !== undefined &&
      computed.paddingLeft !== undefined && computed.paddingRight !== undefined &&
      computed.paddingTop === computed.paddingBottom &&
      computed.paddingTop === computed.paddingLeft &&
      computed.paddingTop === computed.paddingRight) {
    s.padding = `EdgeInsets.all(${computed.paddingTop})`;
  } else if (computed.paddingTop !== undefined || computed.paddingRight !== undefined ||
             computed.paddingBottom !== undefined || computed.paddingLeft !== undefined) {
    const t = computed.paddingTop ?? 0;
    const r = computed.paddingRight ?? 0;
    const b = computed.paddingBottom ?? 0;
    const l = computed.paddingLeft ?? 0;
    if (t === b && r === l && t !== r) {
      s.padding = `EdgeInsets.symmetric(vertical: ${t}, horizontal: ${r})`;
    } else {
      s.padding = `EdgeInsets.only(left: ${l}, top: ${t}, right: ${r}, bottom: ${b})`;
    }
  }

  // ── Margin (Flutter Container supports margin) ──
  if (computed.marginTop !== undefined) {
    s.margin = `EdgeInsets.all(${computed.marginTop})`;
  }

  // ── Sizing ──
  if (computed.width) s.width = toFlutterSize(computed.width);
  if (computed.height) s.height = toFlutterSize(computed.height);

  // ── Decoration (background, border-radius, border, shadow) ──
  if (computed.backgroundColor || computed.borderRadius || computed.borderWidth) {
    s.hasDecoration = true;
  }

  // ── Background ──
  if (computed.backgroundColor) {
    s.background = `Color(0x${computed.backgroundColor.replace('#', 'FF')})`;
  }

  // ── Border radius ──
  if (computed.borderRadius) {
    s.borderRadius = `BorderRadius.circular(${computed.borderRadius})`;
  }

  // ── Alignment ──
  if (computed.alignItems === 'center') s.alignment = 'Alignment.center';

  // ── Gap (used for flex container spacing) ──
  if (computed.gap) s.gap = `${computed.gap}`;

  return s;
}

export function lowerFlutterTextStyle(computed: ComputedStyle): LoweredTextStyle {
  const s: LoweredTextStyle = {};
  if (computed.fontSize) s.fontSize = `${computed.fontSize}`;
  if (computed.fontWeight) s.fontWeight = `FontWeight.w${computed.fontWeight}`;
  if (computed.color) s.color = `Color(0x${computed.color.replace('#', 'FF')})`;
  if (computed.textAlign) s.textAlign = `TextAlign.${computed.textAlign}`;
  if (computed.lineHeight) s.lineHeight = `${computed.lineHeight}`;
  return s;
}
```

**New file: `packages/generator-core/src/styles/compose.ts`**

```typescript
import type { ComputedStyle } from '@motarjim/shared';

interface ModifierChain {
  parts: string[];         // e.g. [".padding(16.dp)", ".fillMaxWidth()"]
}

export function lowerComposeModifiers(computed: ComputedStyle): ModifierChain {
  const parts: string[] = [];

  // ── Padding ──
  if (computed.paddingTop !== undefined && computed.paddingBottom !== undefined &&
      computed.paddingLeft !== undefined && computed.paddingRight !== undefined &&
      computed.paddingTop === computed.paddingBottom &&
      computed.paddingTop === computed.paddingLeft &&
      computed.paddingTop === computed.paddingRight) {
    parts.push(`.padding(${computed.paddingTop}.dp)`);
  } else if (computed.paddingTop !== undefined || computed.paddingRight !== undefined ||
             computed.paddingBottom !== undefined || computed.paddingLeft !== undefined) {
    const t = computed.paddingTop ?? 0;
    const r = computed.paddingRight ?? 0;
    const b = computed.paddingBottom ?? 0;
    const l = computed.paddingLeft ?? 0;
    if (t === b && r === l) {
      parts.push(`.padding(horizontal = ${r}.dp, vertical = ${t}.dp)`);
    } else {
      parts.push(`.padding(start = ${l}.dp, top = ${t}.dp, end = ${r}.dp, bottom = ${b}.dp)`);
    }
  }

  // ── Sizing ──
  if (computed.width === '100%') parts.push('.fillMaxWidth()');
  else if (computed.width) parts.push(`.width(${toComposeSize(computed.width)})`);
  if (computed.height === '100%') parts.push('.fillMaxHeight()');
  else if (computed.height) parts.push(`.height(${toComposeSize(computed.height)})`);

  // ── Background ──
  if (computed.backgroundColor) {
    parts.push(`.background(Color(0x${computed.backgroundColor.replace('#', 'FF')}))`);
  }

  // ── Border radius ──
  if (computed.borderRadius) {
    parts.push(`.clip(CircleShape)`);       // simplified — better shape detection needed
  }

  // ── Border ──
  if (computed.borderWidth) {
    const color = computed.borderColor ? `Color(0x${computed.borderColor.replace('#', 'FF')})` : 'Color.Black';
    parts.push(`.border(${computed.borderWidth}.dp, solid ${color})`);
  }

  // ── Flex ──
  if (computed.flex) {
    const weight = parseFloat(computed.flex);
    if (!isNaN(weight)) parts.push(`.weight(${weight}f)`);
  }

  return { parts };
}
```

**New file: `packages/generator-core/src/styles/swiftui.ts`**

```typescript
import type { ComputedStyle } from '@motarjim/shared';

interface ViewModifierChain {
  modifiers: string[];     // e.g. [".padding(16)", ".frame(maxWidth: .infinity)"]
}

export function lowerSwiftUIModifiers(computed: ComputedStyle): ViewModifierChain {
  const modifiers: string[] = [];

  // ── Padding ──
  if (computed.paddingTop !== undefined && computed.paddingBottom !== undefined &&
      computed.paddingLeft !== undefined && computed.paddingRight !== undefined &&
      computed.paddingTop === computed.paddingBottom &&
      computed.paddingTop === computed.paddingLeft &&
      computed.paddingTop === computed.paddingRight) {
    modifiers.push(`.padding(${computed.paddingTop})`);
  } else if (computed.paddingTop !== undefined || computed.paddingRight !== undefined ||
             computed.paddingBottom !== undefined || computed.paddingLeft !== undefined) {
    // SwiftUI uses EdgeInsets
    const t = computed.paddingTop ?? 0;
    const l = computed.paddingLeft ?? 0;
    const b = computed.paddingBottom ?? 0;
    const r = computed.paddingRight ?? 0;
    modifiers.push(`.padding(EdgeInsets(top: ${t}, leading: ${l}, bottom: ${b}, trailing: ${r}))`);
  }

  // ── Sizing ──
  if (computed.width === '100%') modifiers.push('.frame(maxWidth: .infinity)');
  else if (computed.width) modifiers.push(`.frame(width: ${toSwiftUISize(computed.width)})`);
  if (computed.height === '100%') modifiers.push('.frame(maxHeight: .infinity)');
  else if (computed.height) modifiers.push(`.frame(height: ${toSwiftUISize(computed.height)})`);

  // ── Background ──
  if (computed.backgroundColor) {
    modifiers.push(`.background(Color(hex: "${computed.backgroundColor}"))`);
  }

  // ── Corner radius ──
  if (computed.borderRadius) {
    modifiers.push(`.cornerRadius(${computed.borderRadius})`);
  }

  // ── Shadow ──
  if (computed.borderWidth) {
    // minimal shadow fallback
  }

  return { modifiers };
}
```

**Shared size helpers: `packages/generator-core/src/styles/size.ts`**

```typescript
// Flutter: parse CSS size → Dart number
//   "100%" → double.infinity
//   "16px" → 16.0
//   "auto" → null
export function toFlutterSize(value: string): string | undefined {
  if (value === '100%') return 'double.infinity';
  if (value === 'auto') return undefined;
  const m = /^([\d.]+)px$/.exec(value);
  if (m) return m[1];
  const n = /^([\d.]+)$/.exec(value);
  if (n) return n[1];
  return undefined;
}

// Compose: parse CSS size → dp string
export function toComposeSize(value: string): string {
  if (value === '100%') return 'fillMaxWidth()';  // caller context
  const m = /^([\d.]+)px$/.exec(value);
  if (m) return `${m[1]}.dp`;
  return value;
}

// SwiftUI: parse CSS size → CGFloat
export function toSwiftUISize(value: string): string | undefined {
  if (value === '100%') return '.infinity';
  const m = /^([\d.]+)px$/.exec(value);
  if (m) return m[1];
  return undefined;
}
```

### Step 3: Add import management to `generator-core`

**New file: `packages/generator-core/src/imports.ts`**

```typescript
// ── Import Tracker ──
// Collects widget types used during tree walk, then emits
// the minimal required import statements for each platform.

export interface ImportTracker {
  /** Mark a widget type as used */
  use(type: string): void;
  /** Mark a package/module as required */
  useModule(module: string): void;
  /** Generate import string for Flutter */
  toFlutterImports(): string;
  /** Generate import string for Compose */
  toComposeImports(): string;
  /** Generate import string for SwiftUI */
  toSwiftUIImports(): string;
  /** Reset for next compilation */
  reset(): void;
}

export function createImportTracker(): ImportTracker {
  const widgets = new Set<string>();
  const modules = new Set<string>();

  return {
    use(type) { widgets.add(type); },
    useModule(module) { modules.add(module); },
    toFlutterImports() {
      // Flutter: all Material widgets come from one import
      const lines = ["import 'package:flutter/material.dart';"];
      if (modules.has('cupertino') || widgets.has('CupertinoButton')) {
        lines.push("import 'package:flutter/cupertino.dart';");
      }
      return lines.join('\n');
    },
    toComposeImports() {
      const lines = [
        'import androidx.compose.material3.*',
        'import androidx.compose.runtime.*',
        'import androidx.compose.foundation.layout.*',
        'import androidx.compose.ui.Modifier',
      ];
      if (widgets.has('Image') || widgets.has('Icon')) {
        lines.push("import androidx.compose.ui.res.painterResource");
      }
      return lines.join('\n');
    },
    toSwiftUIImports() {
      const lines = ['import SwiftUI'];
      if (widgets.has('Map')) {
        lines.push('import MapKit');
      }
      return lines.join('\n');
    },
    reset() {
      widgets.clear();
      modules.clear();
    },
  };
}
```

### Step 4: Wire style lowering into each generator

**Updated `NodeEmitter` interface in `generator-core/index.ts`:**

```typescript
export interface NodeEmitter {
  indentUnit: string;
  /** Called before tree walk to set up platform context */
  init?(tracker: ImportTracker): void;
  emitText(node: UiNode, indent: string): string;
  emitButton(node: UiNode, indent: string, label: string, children: string[]): string;
  emitRow(indent: string, children: string[]): string;
  emitColumn(indent: string, children: string[]): string;
  emitContainer(node: UiNode, indent: string, children: string[]): string;
  emitCard(node: UiNode, indent: string, children: string[]): string;
  emitImage(node: UiNode, indent: string): string;
  emitTextField(node: UiNode, indent: string): string;
  emitAppBar(indent: string, title: string): string;
  emitScrollView(indent: string, children: string[]): string;
  emitForm(node: UiNode, indent: string, children: string[]): string;
  emitFooter(indent: string, children: string[]): string;
  emitDefault(node: UiNode, indent: string, children: string[]): string;
}
```

**Updated `walkTree` signature:**
```typescript
export function walkTree(
  node: UiNode,
  emitter: NodeEmitter,
  level: number = 0,
  sourceComments: boolean = false,
  tracker?: ImportTracker,        // NEW
): string
```

Each emitter method calls `tracker.use('Container')`, `tracker.use('Row')`, etc. when it emits a widget. At the end, `tracker.toFlutterImports()` produces the correct import block.

### Step 5: Rewrite each generator

**Flutter (`packages/generators/flutter/index.ts`):**

Key changes:
- `emitContainer` calls `lowerFlutterContainerStyle(node.computed)` and emits `Container( padding: EdgeInsets.all(16), decoration: BoxDecoration(...), child: ... )`
- `emitText` calls `lowerFlutterTextStyle(node.computed)` and emits `Text("value", style: TextStyle(...))`
- `emitRow`/`emitColumn` emit `Row`/`Column` with `mainAxisAlignment`/`crossAxisAlignment` from computed flex fields
- `generate()` calls `tracker.use(widget)` for every widget type emitted
- No more `formatProps()` — only `LoweredContainerStyle`/`LoweredTextStyle` used
- No more regex parsing of CSS values

```typescript
// Example emitContainer after refactor:
emitContainer(node: UiNode, indent: string, children: string[]): string {
  const computed = node.computed;
  const style = computed ? lowerFlutterContainerStyle(computed) : null;
  const lines: string[] = [];

  tracker.use('Container');

  if (style?.padding) lines.push(`${indent}  padding: ${style.padding},`);
  if (style?.margin) lines.push(`${indent}  margin: ${style.margin},`);
  if (style?.alignment) lines.push(`${indent}  alignment: ${style.alignment},`);

  if (style?.hasDecoration) {
    const deco: string[] = [];
    if (style?.background) deco.push(`color: ${style.background}`);
    if (style?.borderRadius) deco.push(`borderRadius: ${style.borderRadius}`);
    if (style?.border) deco.push(`border: ${style.border}`);
    lines.push(`${indent}  decoration: BoxDecoration(\n${deco.join(',\n')}\n${indent}  ),`);
  }

  if (children.length === 0) {
    return `Container(${lines.length ? '\n' + lines.join('\n') + '\n' + indent : ''})`;
  }
  if (children.length === 1) {
    return `Container(\n${lines.join('\n')}\n${indent}  child: ${children[0]},\n${indent})`;
  }
  return `Container(\n${lines.join('\n')}\n${indent}  child: Column(\n${indent}    children: [\n${children.join(',\n')},\n${indent}    ],\n${indent}  ),\n${indent})`;
}
```

**Compose (`packages/generators/compose/index.ts`):**

Key changes:
- `emitContainer` calls `lowerComposeModifiers(node.computed)` → `Modifier.padding(16.dp).fillMaxWidth().background(...)`
- `emitText` calls `lowerComposeTextStyle(node.computed)` → `Text("value", fontSize = 16.sp, color = Color(...))`
- `emitCard` uses real `Card` styling

```typescript
// Example emitContainer after refactor:
emitContainer(node: UiNode, indent: string, children: string[]): string {
  const computed = node.computed;
  const modifiers = computed ? lowerComposeModifiers(computed) : null;
  const modStr = modifiers?.parts.length
    ? `Modifier${modifiers.parts.join('')}`
    : 'Modifier';

  tracker.use('Box');

  if (!children.length) {
    return `${indent}Box(modifier = ${modStr})`;
  }
  return `${indent}Box(modifier = ${modStr}) {\n${children.join('\n')}\n${indent}}`;
}
```

**SwiftUI (`packages/generators/swiftui/index.ts`):**

Key changes:
- `emitContainer` calls `lowerSwiftUIModifiers(node.computed)` → `.padding(16).frame(maxWidth: .infinity).background(...)`
- `emitText` → `Text("value").font(.system(size: 16)).foregroundColor(...)`

```typescript
// Example emitContainer after refactor:
emitContainer(node: UiNode, indent: string, children: string[]): string {
  const computed = node.computed;
  const modifiers = computed ? lowerSwiftUIModifiers(computed) : null;
  const modStr = modifiers?.modifiers.join('\n' + indent) ?? '';

  tracker.use('VStack');

  if (!children.length) {
    return `${indent}Color.clear${modStr ? '\n' + indent + modStr : ''}`;
  }
  return `${indent}VStack {\n${children.join('\n')}\n${indent}}${modStr ? '\n' + indent + modStr : ''}`;
}
```

### Step 6: Use widget engine in emitters

The existing `widget-engine.ts` has `selectWidget()` which returns the optimal platform-specific widget name for each `UiNode`. The emitter should use it instead of hardcoding.

For example, `emitContainer` currently always emits `Container` (Flutter) / `Box` (Compose) / `VStack` (SwiftUI). But the widget engine might suggest `Center`, `SingleChildScrollView`, or `LazyColumn` depending on child count and intent.

```typescript
import { selectWidget } from '@motarjim/generator-core';

emitContainer(node: UiNode, indent: string, children: string[]): string {
  const suggestion = selectWidget(node, 'flutter');
  tracker.use(suggestion.widget);

  // Instead of hardcoding "Container", emit suggestion.widget
  // with style lowering
}
```

Add `selectWidget()` call near the top of `walkTree()` in `generator-core/index.ts` and pass the result to each emit method:

```typescript
// In walkTree, before dispatching:
const suggestion = selectWidget(node, platform);  // platform needed in context
```

Or, simpler: use `selectWidget` inside each platform's emitter and let them decide the widget name.

### Step 7: File structure changes

```
packages/generator-core/
  index.ts                       ← exports: walkTree, NodeEmitter, ImportTracker, etc.
  src/
    imports.ts                   ← ImportTracker implementation
    styles/
      common.ts                  ← Shared style lowering types
      size.ts                    ← toFlutterSize, toComposeSize, toSwiftUISize
      flutter.ts                 ← lowerFlutterContainerStyle, lowerFlutterTextStyle
      compose.ts                 ← lowerComposeModifiers, lowerComposeTextStyle
      swiftui.ts                 ← lowerSwiftUIModifiers, lowerSwiftUITextStyle
  (widget-engine.ts stays)

packages/generators/flutter/
  index.ts                       ← rewritten to use lowerFlutterStyle + ImportTracker
  (no new files needed)

packages/generators/compose/
  index.ts                       ← rewritten to use lowerComposeModifiers + ImportTracker

packages/generators/swiftui/
  index.ts                       ← rewritten to use lowerSwiftUIModifiers + ImportTracker
```

---

## Validation

### Correctness checks after refactor

| Check | Method |
|---|---|
| No regex CSS parsing in generators | `rg 'parseInt\|parseFloat\|px' packages/generators/` |
| All styles come from `node.computed` | Each emitter reads `node.computed` for style values |
| Generators only translate, never infer | Style values are already resolved to platform types by the lowering layer |
| Import minimality | `ImportTracker` tracks only used widgets |
| Semantic output matches | Run `npx tsx packages/cli/bin.ts convert examples/*.html --css ...` and verify output |

### Test plan

1. **Unit tests** for each style lowering function:
   - `lowerFlutterContainerStyle({ paddingTop: 16, paddingLeft: 16, ... })` → `EdgeInsets.all(16)`
   - `lowerComposeModifiers({ backgroundColor: '#FF0000' })` → `.background(Color(0xFFFF0000))`
   - `lowerSwiftUIModifiers({ width: '100%' })` → `.frame(maxWidth: .infinity)`

2. **Generator snapshot tests**: generate code from reference HTML files and compare to expected snapshots.

3. **Integration test**: run full pipeline on all example files and verify output compiles on each platform.

---

## Migration Strategy

| Phase | What | When |
|---|---|---|
| 1 | Remove CSS duplication from `extractProps()` in IR | Immediate — no generator impact yet |
| 2 | Add `styles/` modules to `generator-core` | Parallel with phase 1 |
| 3 | Add `ImportTracker` to `generator-core` | Parallel with phase 1 |
| 4 | Rewrite Flutter generator with style lowering | After phases 1-3 |
| 5 | Rewrite Compose generator with style lowering | After phase 4 (pattern established) |
| 6 | Rewrite SwiftUI generator with style lowering | After phase 4 (pattern established) |
| 7 | Wire `selectWidget()` into emitters | After phases 4-6 |
| 8 | Snapshot tests + integration verification | Throughout |
