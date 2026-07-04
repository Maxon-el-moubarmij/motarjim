import type { GenerateResult, Result, PlatformTarget } from '@motarjim/shared';
import type {
  IrNode,
  LayoutIR,
  SemanticIR,
  ComputedStyle,
  FlexLayout,
  StackLayout,
  ScrollLayout,
  AbsoluteLayout,
} from '@motarjim/shared/ir-v2.js';
import { DiagnosticBag } from '@motarjim/shared/diagnostics.js';
import { countIrNodes, escapeStringExtra, walkIrTree, type IrEmitter } from '@motarjim/generator-core';

function escapeSwift(s: string): string {
  return escapeStringExtra(s, { '"': '\\"' });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace(/^#/, '');
  let full: string;
  if (h.length === 3) {
    full = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  } else if (h.length === 6) {
    full = h;
  } else if (h.length === 8) {
    full = h.slice(2);
  } else {
    return null;
  }
  const num = parseInt(full, 16);
  if (isNaN(num)) return null;
  return { r: ((num >> 16) & 0xFF) / 255, g: ((num >> 8) & 0xFF) / 255, b: (num & 0xFF) / 255 };
}

function formatColor(color: string): string {
  const rgb = hexToRgb(color);
  if (rgb) {
    return `Color(red: ${rgb.r}, green: ${rgb.g}, blue: ${rgb.b})`;
  }
  return `Color("${escapeSwift(color)}")`;
}

function buildModifiers(cs: ComputedStyle): string[] {
  const mods: string[] = [];

  if (cs.backgroundColor) {
    mods.push(`.background(${formatColor(cs.backgroundColor)})`);
  }
  if (cs.borderRadius !== undefined) {
    mods.push(`.cornerRadius(${cs.borderRadius})`);
  }
  if (cs.opacity !== undefined) {
    mods.push(`.opacity(${cs.opacity})`);
  }
  if (cs.width && !cs.height) {
    mods.push(`.frame(width: ${formatValue(cs.width)})`);
  } else if (!cs.width && cs.height) {
    mods.push(`.frame(height: ${formatValue(cs.height)})`);
  } else if (cs.width && cs.height) {
    mods.push(`.frame(width: ${formatValue(cs.width)}, height: ${formatValue(cs.height)})`);
  }

  const hasPad = cs.paddingTop !== undefined || cs.paddingRight !== undefined ||
    cs.paddingBottom !== undefined || cs.paddingLeft !== undefined;
  if (hasPad) {
    const t = cs.paddingTop ?? 0;
    const r = cs.paddingRight ?? 0;
    const b = cs.paddingBottom ?? 0;
    const l = cs.paddingLeft ?? 0;
    mods.push(`.padding(EdgeInsets(top: ${t}, leading: ${l}, bottom: ${b}, trailing: ${r}))`);
  }

  return mods;
}

function formatValue(val: unknown): string {
  if (typeof val === 'string') {
    if (val.match(/^\d+px$/)) return String(parseInt(val, 10));
    if (val.match(/^\d+$/)) return val;
    return `"${escapeSwift(val)}"`;
  }
  return String(val);
}

function applyModifiers(view: string, cs: ComputedStyle): string {
  const mods = buildModifiers(cs);
  if (mods.length === 0) return view;
  return `${view}\n${mods.join('\n')}`;
}

const swiftuiIrEmitter: IrEmitter = {
  indentUnit: '    ',

  emitLayout(layout: LayoutIR, indent: string, children: string[], cs: ComputedStyle): string {
    const i2 = indent + '    ';
    const child = children[0] ?? '';
    const label = applyModifiers('', cs).trim();

    switch (layout.strategy) {
      case 'flex': {
        const flex = layout as FlexLayout;
        const isRow = flex.direction === 'row' || flex.direction === 'row-reverse';
        const widget = isRow ? 'HStack' : 'VStack';

        const props: string[] = [];
        if (isRow && flex.alignItems !== 'stretch') {
          props.push(`alignment: .${flex.alignItems}`);
        }
        if (!isRow && flex.alignItems !== 'stretch') {
          props.push(`alignment: .${flex.alignItems}`);
        }
        if (flex.justifyContent !== 'start') {
          if (isRow) {
            const spacing = flex.justifyContent === 'space-between' || flex.justifyContent === 'space-around' || flex.justifyContent === 'space-evenly'
              ? '' : '';
            props.push(`spacing: ${flex.gap > 0 ? flex.gap : 8}`);
          } else {
            props.push(`spacing: ${flex.gap > 0 ? flex.gap : 0}`);
          }
        } else if (flex.gap > 0) {
          props.push(`spacing: ${flex.gap}`);
        }

        const propStr = props.length > 0 ? `(alignment: .${isRow ? 'center' : 'leading'})` : '';
        const block = child ? `\n${child}\n${indent}` : '';
        let result = `${widget}${propStr} {${block}}`;
        return applyModifiers(result, cs);
      }

      case 'box': {
        if (!child) {
          const bgMod = cs.backgroundColor ? `.background(${formatColor(cs.backgroundColor)})` : '';
          return `Color.clear${bgMod}`;
        }
        let result = child;
        result = applyModifiers(result, cs);
        return result;
      }

      case 'stack': {
        const stack = layout as StackLayout;
        const alignStr = `${capitalize(stack.alignment.horizontal)}${capitalize(stack.alignment.vertical)}`;
        let result = `${indent}ZStack(alignment: .${stack.alignment.horizontal == 'center' && stack.alignment.vertical == 'center' ? 'center' : alignStr}) {\n${child}\n${indent}}`;
        return applyModifiers(result, cs);
      }

      case 'scroll': {
        const scroll = layout as ScrollLayout;
        const isHorizontal = scroll.axis === 'horizontal';
        if (isHorizontal) {
          return `ScrollView(.horizontal) {\n${i2}LazyHStack {\n${child}\n${i2}}\n${indent}}`;
        }
        return `ScrollView {\n${i2}LazyVStack {\n${child}\n${i2}}\n${indent}}`;
      }

      case 'absolute': {
        const abs = layout as AbsoluteLayout;
        const x = abs.position.left ?? 0;
        const y = abs.position.top ?? 0;
        let result = `${indent}ZStack {\n${i2}${child}\n${i2}.offset(x: ${x}, y: ${y})\n${indent}}`;
        return applyModifiers(result, cs);
      }

      case 'none':
      default:
        return child || '';
    }
  },

  emitText(sem: SemanticIR & { role: 'text' }, cs: ComputedStyle, indent: string): string {
    const content = sem.content ?? '';
    let result = `Text("${escapeSwift(content)}")`;

    if (cs.fontSize || cs.fontWeight || cs.color || cs.lineHeight || cs.textAlign) {
      let fontStr = '';
      if (cs.fontWeight) {
        const weightMap: Record<number, string> = {
          100: '.ultraLight', 200: '.thin', 300: '.light', 400: '.regular',
          500: '.medium', 600: '.semibold', 700: '.bold', 800: '.heavy', 900: '.black',
        };
        fontStr = `.fontWeight(${weightMap[cs.fontWeight] ?? '.regular'})`;
      }
      if (cs.fontSize) {
        result += `\n${indent}    .font(.system(size: ${cs.fontSize}))`;
      }
      if (fontStr) result += `\n${indent}    ${fontStr}`;
      if (cs.color) result += `\n${indent}    .foregroundColor(${formatColor(cs.color)})`;
      if (cs.lineHeight) {
        result += `\n${indent}    .lineSpacing(${cs.lineHeight - (cs.fontSize ?? 16)})`;
      }
      if (cs.textAlign) {
        const alignMap: Record<string, string> = {
          left: '.leading', right: '.trailing', center: '.center', justify: '.center',
        };
        result += `\n${indent}    .multilineTextAlignment(${alignMap[cs.textAlign] ?? '.leading'})`;
      }
    }

    return applyModifiers(result, cs);
  },

  emitHeading(sem: SemanticIR & { role: 'heading' }, cs: ComputedStyle, indent: string): string {
    const content = sem.content ?? '';
    const level = sem.level ?? 2;
    const defaultSizes: Record<number, number> = { 1: 34, 2: 28, 3: 24, 4: 20, 5: 16, 6: 14 };
    const defaultWeights: Record<number, number> = { 1: 700, 2: 700, 3: 700, 4: 700, 5: 600, 6: 600 };

    const fontSize = cs.fontSize ?? defaultSizes[level];
    const fontWeight = cs.fontWeight ?? defaultWeights[level];
    const weightMap: Record<number, string> = {
      100: '.ultraLight', 200: '.thin', 300: '.light', 400: '.regular',
      500: '.medium', 600: '.semibold', 700: '.bold', 800: '.heavy', 900: '.black',
    };

    let result = `Text("${escapeSwift(content)}")`;
    result += `\n${indent}    .font(.system(size: ${fontSize}, weight: ${weightMap[fontWeight] ?? '.bold'}))`;
    if (cs.color) result += `\n${indent}    .foregroundColor(${formatColor(cs.color)})`;

    return applyModifiers(result, cs);
  },

  emitButton(sem: SemanticIR & { role: 'button' }, cs: ComputedStyle, indent: string): string {
    const label = sem.label || 'Button';
    let result = `Button("${escapeSwift(label)}") {\n${indent}    // action\n${indent}}`;
    if (cs.backgroundColor) {
      result += `\n${indent}    .background(${formatColor(cs.backgroundColor)})`;
    }
    if (cs.color) {
      result += `\n${indent}    .foregroundColor(${formatColor(cs.color)})`;
    }
    if (cs.borderRadius !== undefined) {
      result += `\n${indent}    .cornerRadius(${cs.borderRadius})`;
    }
    return applyModifiers(result, cs);
  },

  emitLink(sem: SemanticIR & { role: 'link' }, cs: ComputedStyle, indent: string): string {
    const label = sem.label || sem.href || 'Link';
    const url = sem.href ? `URL(string: "${escapeSwift(sem.href)}")!` : 'URL(string: "#")!';
    let result = `Link("${escapeSwift(label)}", destination: ${url})`;
    if (cs.color) result += `\n${indent}    .foregroundColor(${formatColor(cs.color)})`;
    if (cs.fontSize) result += `\n${indent}    .font(.system(size: ${cs.fontSize}))`;
    return applyModifiers(result, cs);
  },

  emitImage(sem: SemanticIR & { role: 'image' }, _cs: ComputedStyle, indent: string): string {
    const src = sem.source || '';
    const alt = sem.alt || '';
    let result: string;

    if (src.startsWith('http://') || src.startsWith('https://')) {
      result = `AsyncImage(url: URL(string: "${escapeSwift(src)}")!) { phase in\n${indent}    if let image = phase.image {\n${indent}        image.resizable().aspectRatio(contentMode: .fit)\n${indent}    } else if phase.error != nil {\n${indent}        Color.gray\n${indent}    } else {\n${indent}        ProgressView()\n${indent}    }\n${indent}}`;
    } else {
      result = `Image("${escapeSwift(src)}")\n${indent}    .resizable()\n${indent}    .aspectRatio(contentMode: .fit)`;
    }
    if (alt) {
      result += `\n${indent}    .accessibilityLabel("${escapeSwift(alt)}")`;
    }
    return result;
  },

  emitIcon(sem: SemanticIR & { role: 'icon' }, _cs: ComputedStyle, indent: string): string {
    let result = `Image(systemName: "${escapeSwift(sem.name)}")`;
    result += `\n${indent}    .font(.system(size: ${sem.size}))`;
    return result;
  },

  emitInput(sem: SemanticIR & { role: 'input' }, cs: ComputedStyle, indent: string): string {
    const placeholder = sem.placeholder ? `"${escapeSwift(sem.placeholder)}"` : `"${escapeSwift(sem.name ?? 'Input')}"`;
    let result = `TextField(${placeholder}, text: .constant(""))\n${indent}    .textFieldStyle(.roundedBorder)`;
    return applyModifiers(result, cs);
  },

  emitTextarea(sem: SemanticIR & { role: 'textarea' }, cs: ComputedStyle, indent: string): string {
    let result = `TextEditor(text: .constant(""))\n${indent}    .frame(minHeight: ${(sem.rows ?? 4) * 20})`;
    return applyModifiers(result, cs);
  },

  emitSelect(_sem: SemanticIR & { role: 'select' }, cs: ComputedStyle, indent: string): string {
    let result = `Picker("Select", selection: .constant("")) {\n${indent}    Text("Option 1").tag("1")\n${indent}    Text("Option 2").tag("2")\n${indent}}`;
    return applyModifiers(result, cs);
  },

  emitForm(_sem: SemanticIR & { role: 'form' }, cs: ComputedStyle, indent: string, children: string[]): string {
    const i2 = indent + '    ';
    const childrenStr = children.join('\n');
    let result = `Form {\n${childrenStr}\n${indent}}`;
    return applyModifiers(result, cs);
  },

  emitList(_sem: SemanticIR & { role: 'list' }, cs: ComputedStyle, indent: string, children: string[]): string {
    const childrenStr = children.join('\n');
    let result = `List {\n${childrenStr}\n${indent}}`;
    return applyModifiers(result, cs);
  },

  emitListItem(sem: SemanticIR & { role: 'list-item' }, cs: ComputedStyle, indent: string): string {
    let result = `Text("${escapeSwift(sem.label)}")`;
    return applyModifiers(result, cs);
  },

  emitDivider(_sem: SemanticIR & { role: 'divider' }, cs: ComputedStyle, indent: string): string {
    let result = `Divider()`;
    return applyModifiers(result, cs);
  },

  emitGeneric(_sem: SemanticIR & { role: 'generic' }, cs: ComputedStyle, indent: string, children: string[]): string {
    if (children.length === 0) {
      const mods = buildModifiers(cs);
      if (mods.length === 0) return '';
      const bgMod = cs.backgroundColor ? `.background(${formatColor(cs.backgroundColor)})` : '';
      return `Color.clear${bgMod}`;
    }
    if (children.length === 1) {
      return applyModifiers(children[0], cs);
    }
    let result = `VStack {\n${children.join('\n')}\n${indent}}`;
    return applyModifiers(result, cs);
  },

  emitUnknown(_sem: SemanticIR & { role: 'unknown' }, cs: ComputedStyle, indent: string, children: string[]): string {
    if (children.length === 0) {
      const mods = buildModifiers(cs);
      if (mods.length === 0) return '';
      const bgMod = cs.backgroundColor ? `.background(${formatColor(cs.backgroundColor)})` : '';
      return `Color.clear${bgMod}`;
    }
    if (children.length === 1) {
      return applyModifiers(children[0], cs);
    }
    let result = `VStack {\n${children.join('\n')}\n${indent}}`;
    return applyModifiers(result, cs);
  },
};

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateIr(node: IrNode, name: string = 'GeneratedView'): Result<GenerateResult> {
  const bag = new DiagnosticBag();
  const start = performance.now();

  const body = walkIrTree(node, swiftuiIrEmitter, 0);
  const lines = body.split('\n');
  const indentedBody = lines
    .map((line, i) => i === 0 ? line : `    ${line}`)
    .join('\n');

  const code = `import SwiftUI

struct ${name}: View {
    var body: some View {
${indentedBody}
    }
}
`;

  return bag.toResult({
    code,
    metadata: {
      platform: 'swiftui' as PlatformTarget,
      nodes: countIrNodes(node),
      duration: Math.round(performance.now() - start),
    },
  });
}
