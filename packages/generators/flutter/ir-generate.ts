import type { GenerateResult, Result, PlatformTarget } from '@motarjim/shared';
import type {
  IrNode,
  LayoutIR,
  SemanticIR,
  ComputedStyle,
} from '@motarjim/shared/ir-v2.js';
import { DiagnosticBag } from '@motarjim/shared/diagnostics.js';
import { countIrNodes, escapeStringExtra, walkIrTree, type IrEmitter } from '@motarjim/generator-core';

function escapeDart(s: string): string {
  return escapeStringExtra(s, { '$': '\\$' });
}

function formatValue(val: unknown): string {
  if (typeof val === 'string') {
    if (val.match(/^\d+px$/)) return String(parseInt(val, 10));
    if (val.match(/^\d+$/)) return val;
    return `"${escapeDart(val)}"`;
  }
  return String(val);
}

function formatComputedStyle(cs: ComputedStyle, indent: string): string[] {
  const lines: string[] = [];
  const p = (name: string, val: unknown) => {
    if (val !== undefined && val !== null) {
      lines.push(`${indent}${name}: ${formatValue(val)}`);
    }
  };

  if (cs.backgroundColor) p('color', cs.backgroundColor);
  if (cs.borderRadius !== undefined) {
    lines.push(`${indent}borderRadius: BorderRadius.circular(${cs.borderRadius})`);
  }
  if (cs.opacity !== undefined) p('opacity', cs.opacity);

  return lines;
}

function formatBoxDecoration(cs: ComputedStyle, indent: string): string[] {
  const lines: string[] = [];
  const inner: string[] = [];

  if (cs.backgroundColor) {
    inner.push(`${indent}  color: ${formatValue(cs.backgroundColor)}`);
  }
  if (cs.borderRadius !== undefined) {
    inner.push(`${indent}  borderRadius: BorderRadius.circular(${cs.borderRadius})`);
  }
  if (cs.opacity !== undefined) {
    inner.push(`${indent}  opacity: ${cs.opacity}`);
  }

  if (inner.length > 0) {
    lines.push(`${indent}decoration: BoxDecoration(`);
    lines.push(inner.join(',\n'));
    lines.push(`${indent}),`);
  }

  if (cs.paddingTop !== undefined || cs.paddingRight !== undefined ||
      cs.paddingBottom !== undefined || cs.paddingLeft !== undefined) {
    const t = cs.paddingTop ?? 0;
    const r = cs.paddingRight ?? 0;
    const b = cs.paddingBottom ?? 0;
    const l = cs.paddingLeft ?? 0;
    lines.push(`${indent}padding: const EdgeInsets.only(` +
      `top: ${t}, right: ${r}, bottom: ${b}, left: ${l}),`);
  }

  if (cs.marginTop !== undefined || cs.marginRight !== undefined ||
      cs.marginBottom !== undefined || cs.marginLeft !== undefined) {
    const t = cs.marginTop ?? 0;
    const r = cs.marginRight ?? 0;
    const b = cs.marginBottom ?? 0;
    const l = cs.marginLeft ?? 0;
    lines.push(`${indent}margin: const EdgeInsets.only(` +
      `top: ${t}, right: ${r}, bottom: ${b}, left: ${l}),`);
  }

  return lines;
}

function formatSizedBox(cs: ComputedStyle, indent: string): string[] {
  const lines: string[] = [];
  if (cs.width) lines.push(`${indent}width: ${formatValue(cs.width)}`);
  if (cs.height) lines.push(`${indent}height: ${formatValue(cs.height)}`);
  if (cs.minWidth) lines.push(`${indent}minWidth: ${formatValue(cs.minWidth)}`);
  if (cs.maxWidth) lines.push(`${indent}maxWidth: ${formatValue(cs.maxWidth)}`);
  if (cs.minHeight) lines.push(`${indent}minHeight: ${formatValue(cs.minHeight)}`);
  if (cs.maxHeight) lines.push(`${indent}maxHeight: ${formatValue(cs.maxHeight)}`);
  return lines;
}

const flutterIrEmitter: IrEmitter = {
  indentUnit: '  ',

  emitLayout(layout: LayoutIR, indent: string, children: string[], cs: ComputedStyle): string {
    const i2 = indent + '  ';
    const childrenBlock = children.length > 0
      ? `[\n${children.join(',\n')},\n${indent}]`
      : '[]';

    switch (layout.strategy) {
      case 'flex': {
        const flex = layout as FlexLayout;
        const isRow = flex.direction === 'row' || flex.direction === 'row-reverse';
        const widget = isRow ? 'Row' : 'Column';

        const props: string[] = [];
        if (flex.justifyContent !== 'start') {
          props.push(`${i2}mainAxisAlignment: MainAxisAlignment.${flex.justifyContent}`);
        }
        if (flex.alignItems !== 'stretch') {
          props.push(`${i2}crossAxisAlignment: CrossAxisAlignment.${flex.alignItems}`);
        }
        if (flex.gap > 0) {
          props.push(`${i2}spacing: ${flex.gap}`);
        }

        const deco = formatBoxDecoration(cs, i2);
        const sizing = formatSizedBox(cs, i2);

        const allProps = [...props, ...deco, ...sizing];
        const propBlock = allProps.length > 0 ? `\n${allProps.join(',\n')},\n` : '';

        return `${widget}(${propBlock}${i2}children: ${childrenBlock}\n${indent})`;
      }

      case 'box': {
        const deco = formatBoxDecoration(cs, i2);
        const sizing = formatSizedBox(cs, i2);

        if (children.length === 0) {
          const allProps = [...deco, ...sizing];
          if (allProps.length === 0) return 'const SizedBox.shrink()';
          return `Container(\n${allProps.join(',\n')},\n${indent})`;
        }
        if (children.length === 1) {
          const childBlock = children[0];
          const allProps = [...deco, ...sizing];
          if (allProps.length === 0) return childBlock;
          return `Container(\n${allProps.join(',\n')},\n${i2}child: ${childBlock},\n${indent})`;
        }

        const allProps = [...deco, ...sizing];
        return `Container(\n${allProps.join(',\n')},\n${i2}child: Column(\n${i2}  children: ${childrenBlock},\n${i2}),\n${indent})`;
      }

      case 'stack': {
        const stack = layout as StackLayout;
        const props: string[] = [];
        if (stack.alignment) {
          props.push(`${i2}alignment: Alignment.${stack.alignment.horizontal}-${stack.alignment.vertical}`);
        }
        const deco = formatBoxDecoration(cs, i2);
        const allProps = [...props, ...deco];
        const propBlock = allProps.length > 0 ? `\n${allProps.join(',\n')},\n` : '';
        return `Stack(${propBlock}${i2}children: ${childrenBlock}\n${indent})`;
      }

      case 'scroll': {
        const scroll = layout as ScrollLayout;
        const isHorizontal = scroll.axis === 'horizontal';
        const widget = isHorizontal ? 'ListView' : 'ListView';
        const scrollDir = isHorizontal ? '\nscrollDirection: Axis.horizontal,' : '';
        return `ListView(${scrollDir}\n${i2}children: ${childrenBlock}\n${indent})`;
      }

      case 'absolute': {
        const deco = formatBoxDecoration(cs, i2);
        const allProps = [...deco];
        const propBlock = allProps.length > 0 ? `\n${allProps.join(',\n')},\n` : '';
        return `Positioned(\n${i2}child: ${children[0] ?? 'const SizedBox.shrink()'},\n${indent})`;
      }

      case 'none':
      default:
        if (children.length === 0) return 'const SizedBox.shrink()';
        if (children.length === 1) return children[0];
        return `Column(\n${i2}children: ${childrenBlock}\n${indent})`;
    }
  },

  emitText(sem: SemanticIR & { role: 'text' }, cs: ComputedStyle, indent: string): string {
    const content = sem.content ?? '';
    const props: string[] = [];

    if (cs.fontSize) props.push(`${indent}  fontSize: ${cs.fontSize}`);
    if (cs.fontWeight) props.push(`${indent}  fontWeight: FontWeight.w${cs.fontWeight}`);
    if (cs.color) props.push(`${indent}  color: ${formatValue(cs.color)}`);
    if (cs.lineHeight) props.push(`${indent}  height: ${cs.lineHeight / (cs.fontSize || 16)}`);

    const propBlock = props.length > 0 ? `\nstyle: TextStyle(${props.join(',\n')},\n${indent}),\n` : '';
    return `${indent}Text(\n${indent}  "${escapeDart(content)}",${propBlock}\n${indent})`;
  },

  emitHeading(sem: SemanticIR & { role: 'heading' }, cs: ComputedStyle, indent: string): string {
    const content = sem.content ?? '';
    const level = sem.level ?? 2;
    const defaultSizes: Record<number, number> = { 1: 32, 2: 28, 3: 24, 4: 20, 5: 16, 6: 14 };
    const defaultWeights: Record<number, number> = { 1: 700, 2: 700, 3: 700, 4: 700, 5: 600, 6: 600 };

    const fontSize = cs.fontSize ?? defaultSizes[level] ?? 16;
    const fontWeight = cs.fontWeight ?? defaultWeights[level] ?? 700;
    const props: string[] = [
      `${indent}  fontSize: ${fontSize}`,
      `${indent}  fontWeight: FontWeight.w${fontWeight}`,
    ];
    if (cs.color) props.push(`${indent}  color: ${formatValue(cs.color)}`);
    if (cs.lineHeight) props.push(`${indent}  height: ${cs.lineHeight / fontSize}`);

    const propBlock = `\nstyle: TextStyle(${props.join(',\n')},\n${indent})`;
    return `${indent}Text(\n${indent}  "${escapeDart(content)}",${propBlock},\n${indent})`;
  },

  emitButton(sem: SemanticIR & { role: 'button' }, cs: ComputedStyle, indent: string): string {
    const label = sem.label || 'Button';
    const props: string[] = [];

    if (cs.backgroundColor) {
      props.push(`${indent}  style: ElevatedButton.styleFrom(\n${indent}    backgroundColor: ${formatValue(cs.backgroundColor)},\n${indent}  ),`);
    }
    if (cs.borderRadius !== undefined) {
      props.push(`${indent}  style: ElevatedButton.styleFrom(\n${indent}    shape: RoundedRectangleBorder(\n${indent}      borderRadius: BorderRadius.circular(${cs.borderRadius}),\n${indent}    ),\n${indent}  ),`);
    }

    const propBlock = props.length > 0 ? `\n${props.join(',\n')}\n` : '';
    return `${indent}ElevatedButton(\n${indent}  onPressed: () {},${propBlock}\n${indent}  child: Text("${escapeDart(label)}"),\n${indent})`;
  },

  emitLink(sem: SemanticIR & { role: 'link' }, cs: ComputedStyle, indent: string): string {
    const label = sem.label || sem.href || 'Link';
    const props: string[] = [];
    if (cs.color) props.push(`${indent}  color: ${formatValue(cs.color)}`);
    if (cs.fontWeight) props.push(`${indent}  fontWeight: FontWeight.w${cs.fontWeight}`);
    if (cs.fontSize) props.push(`${indent}  fontSize: ${cs.fontSize}`);

    const propBlock = props.length > 0 ? `\nstyle: TextStyle(${props.join(',\n')},\n${indent}),\n` : '';
    return `${indent}GestureDetector(\n${indent}  onTap: () {},\n${indent}  child: Text(\n${indent}    "${escapeDart(label)}",${propBlock}\n${indent}  ),\n${indent})`;
  },

  emitImage(sem: SemanticIR & { role: 'image' }, _cs: ComputedStyle, indent: string): string {
    const src = sem.source || '';
    const alt = sem.alt || '';
    const altAttr = alt ? `,\n${indent}  semanticLabel: "${escapeDart(alt)}"` : '';

    if (src.startsWith('http://') || src.startsWith('https://')) {
      return `${indent}Image.network(\n${indent}  "${escapeDart(src)}"${altAttr},\n${indent})`;
    }
    return `${indent}Image.asset(\n${indent}  "${escapeDart(src)}"${altAttr},\n${indent})`;
  },

  emitIcon(sem: SemanticIR & { role: 'icon' }, _cs: ComputedStyle, indent: string): string {
    return `${indent}Icon(\n${indent}  Icons.${sem.name},\n${indent}  size: ${sem.size},\n${indent})`;
  },

  emitInput(sem: SemanticIR & { role: 'input' }, _cs: ComputedStyle, indent: string): string {
    const placeholder = sem.placeholder ? `,\n${indent}    hintText: "${escapeDart(sem.placeholder)}"` : '';
    return `${indent}TextField(\n${indent}  decoration: InputDecoration(\n${indent}    labelText: "${escapeDart(sem.name ?? 'Input')}"${placeholder},\n${indent}    border: const OutlineInputBorder(),\n${indent}  ),\n${indent})`;
  },

  emitTextarea(_sem: SemanticIR & { role: 'textarea' }, _cs: ComputedStyle, indent: string): string {
    return `${indent}TextField(\n${indent}  maxLines: ${_sem.rows ?? 4},\n${indent}  decoration: const InputDecoration(\n${indent}    border: OutlineInputBorder(),\n${indent}  ),\n${indent})`;
  },

  emitSelect(_sem: SemanticIR & { role: 'select' }, _cs: ComputedStyle, indent: string): string {
    return `${indent}DropdownButtonFormField(\n${indent}  items: const [],\n${indent}  onChanged: null,\n${indent})`;
  },

  emitForm(_sem: SemanticIR & { role: 'form' }, _cs: ComputedStyle, indent: string, children: string[]): string {
    const childrenBlock = children.join(',\n');
    return `${indent}Form(\n${indent}  child: Column(\n${indent}    children: [\n${childrenBlock},\n${indent}    ],\n${indent}  ),\n${indent})`;
  },

  emitList(_sem: SemanticIR & { role: 'list' }, _cs: ComputedStyle, indent: string, children: string[]): string {
    const childrenBlock = children.join(',\n');
    return `${indent}Column(\n${indent}  children: [\n${childrenBlock},\n${indent}  ],\n${indent})`;
  },

  emitListItem(sem: SemanticIR & { role: 'list-item' }, _cs: ComputedStyle, indent: string): string {
    return `${indent}Text("${escapeDart(sem.label)}")`;
  },

  emitDivider(_sem: SemanticIR & { role: 'divider' }, _cs: ComputedStyle, indent: string): string {
    return `${indent}const Divider()`;
  },

  emitGeneric(_sem: SemanticIR & { role: 'generic' }, _cs: ComputedStyle, indent: string, children: string[]): string {
    if (children.length === 0) return 'const SizedBox.shrink()';
    if (children.length === 1) return children[0];
    const childrenBlock = children.join(',\n');
    return `${indent}Column(\n${indent}  children: [\n${childrenBlock},\n${indent}  ],\n${indent})`;
  },

  emitUnknown(_sem: SemanticIR & { role: 'unknown' }, _cs: ComputedStyle, indent: string, children: string[]): string {
    if (children.length === 0) return 'const SizedBox.shrink()';
    if (children.length === 1) return children[0];
    const childrenBlock = children.join(',\n');
    return `${indent}Column(\n${indent}  children: [\n${childrenBlock},\n${indent}  ],\n${indent})`;
  },
};

export function generateIr(node: IrNode, name: string = 'GeneratedView'): Result<GenerateResult> {
  const bag = new DiagnosticBag();
  const start = performance.now();

  const body = walkIrTree(node, flutterIrEmitter, 0);
  const lines = body.split('\n');
  const indentedBody = lines
    .map((line, i) => i === 0 ? line : `    ${line}`)
    .join('\n');

  const code = `import 'package:flutter/material.dart';

class ${name} extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ${indentedBody};
  }
}
`;

  return bag.toResult({
    code,
    metadata: {
      platform: 'flutter' as PlatformTarget,
      nodes: countIrNodes(node),
      duration: Math.round(performance.now() - start),
    },
  });
}


