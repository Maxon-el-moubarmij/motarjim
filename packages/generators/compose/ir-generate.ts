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

function escapeCompose(s: string): string {
  return escapeStringExtra(s, { '$': '\\$', '"': '\\"' });
}

function formatValue(val: unknown): string {
  if (typeof val === 'string') {
    if (val.match(/^\d+px$/)) return String(parseInt(val, 10));
    if (val.match(/^\d+$/)) return val;
    return `"${escapeCompose(val)}"`;
  }
  return String(val);
}

function formatColor(color: string): string {
  const hex = color.replace(/^#/, '');
  if (/^[0-9a-fA-F]{3,8}$/.test(hex)) {
    const padded = hex.length <= 6 ? `FF${hex.padStart(6, '0')}` : hex.padStart(8, '0');
    return `Color(0x${padded.toUpperCase()})`;
  }
  return `Color(${formatValue(color)})`;
}

function buildModifier(cs: ComputedStyle, indent: string): string {
  const parts: string[] = [];
  const i2 = indent + '    ';

  if (cs.backgroundColor) {
    parts.push(`Modifier.background(${formatColor(cs.backgroundColor)})`);
  }
  if (cs.borderRadius !== undefined) {
    parts.push(`Modifier.clip(RoundedCornerShape(${cs.borderRadius}.dp))`);
  }
  if (cs.opacity !== undefined) {
    parts.push(`Modifier.alpha(${cs.opacity}f)`);
  }
  if (cs.width) parts.push(`Modifier.width(${formatValue(cs.width)}.dp)`);
  if (cs.height) parts.push(`Modifier.height(${formatValue(cs.height)}.dp)`);

  const hasPad = cs.paddingTop !== undefined || cs.paddingRight !== undefined ||
    cs.paddingBottom !== undefined || cs.paddingLeft !== undefined;
  if (hasPad) {
    const t = cs.paddingTop ?? 0;
    const r = cs.paddingRight ?? 0;
    const b = cs.paddingBottom ?? 0;
    const l = cs.paddingLeft ?? 0;
    if (t === r && r === b && b === l) {
      parts.push(`Modifier.padding(${t}.dp)`);
    } else {
      parts.push(`Modifier.padding(start = ${l}.dp, top = ${t}.dp, end = ${r}.dp, bottom = ${b}.dp)`);
    }
  }

  if (parts.length === 0) return 'Modifier';
  return parts.join(`\n${i2}.`);
}

function buildModifierForText(cs: ComputedStyle, indent: string): string[] {
  const lines: string[] = [];
  if (cs.fontSize) lines.push(`fontSize = ${cs.fontSize}.sp`);
  if (cs.fontWeight) lines.push(`fontWeight = FontWeight.W${cs.fontWeight}`);
  if (cs.color) lines.push(`color = ${formatColor(cs.color)}`);
  if (cs.lineHeight) {
    const fontSize = cs.fontSize ?? 16;
    lines.push(`lineHeight = ${cs.lineHeight}.sp`);
  }
  if (cs.textAlign) {
    const alignMap: Record<string, string> = {
      left: 'TextAlign.Start',
      right: 'TextAlign.End',
      center: 'TextAlign.Center',
      justify: 'TextAlign.Justify',
    };
    lines.push(`textAlign = ${alignMap[cs.textAlign] ?? 'TextAlign.Start'}`);
  }
  return lines;
}

const composeIrEmitter: IrEmitter = {
  indentUnit: '    ',

  emitLayout(layout: LayoutIR, indent: string, children: string[], cs: ComputedStyle): string {
    const i2 = indent + '    ';
    const child = children[0] ?? '';
    const mod = buildModifier(cs, indent);

    switch (layout.strategy) {
      case 'flex': {
        const flex = layout as FlexLayout;
        const isRow = flex.direction === 'row' || flex.direction === 'row-reverse';
        const widget = isRow ? 'Row' : 'Column';

        const props: string[] = [];
        props.push(`modifier = ${mod}`);

        if (isRow && flex.justifyContent !== 'start') {
          props.push(`horizontalArrangement = Arrangement.${capitalize(flex.justifyContent)}`);
        }
        if (!isRow && flex.justifyContent !== 'start') {
          props.push(`verticalArrangement = Arrangement.${capitalize(flex.justifyContent)}`);
        }
        if (isRow && flex.alignItems !== 'stretch') {
          props.push(`verticalAlignment = Alignment.${capitalize(flex.alignItems)}`);
        }
        if (!isRow && flex.alignItems !== 'stretch') {
          props.push(`horizontalAlignment = Alignment.${capitalize(flex.alignItems)}`);
        }

        const propStr = props.length > 0 ? `\n${i2}${props.join(`,\n${i2}`)},\n` : '';
        return `${widget}(${propStr}) {\n${child}\n${indent}}`;
      }

      case 'box': {
        if (!child) {
          return `Box(modifier = ${mod})`;
        }
        return `Box(\n${i2}modifier = ${mod},\n${i2}) {\n${child}\n${indent}}`;
      }

      case 'stack': {
        const stack = layout as StackLayout;
        const alignStr = `${capitalize(stack.alignment.horizontal)}${capitalize(stack.alignment.vertical)}`;
        const props: string[] = [];
        props.push(`modifier = ${mod}`);
        if (stack.alignment) {
          props.push(`contentAlignment = Alignment.${alignStr}`);
        }
        const propStr = props.length > 0 ? `\n${i2}${props.join(`,\n${i2}`)},\n` : '';
        return `Box(${propStr}) {\n${child}\n${indent}}`;
      }

      case 'scroll': {
        const scroll = layout as ScrollLayout;
        const isHorizontal = scroll.axis === 'horizontal';
        if (isHorizontal) {
          return `LazyRow(\n${i2}modifier = ${mod},\n${i2}) {\n${child}\n${indent}}`;
        }
        return `LazyColumn(\n${i2}modifier = ${mod},\n${i2}) {\n${child}\n${indent}}`;
      }

      case 'absolute': {
        const abs = layout as AbsoluteLayout;
        const offsetX = abs.position.left ?? 0;
        const offsetY = abs.position.top ?? 0;
        const offsetMod = `Modifier.offset(x = ${offsetX}.dp, y = ${offsetY}.dp)`;
        return `Box(\n${i2}modifier = ${mod}.${offsetMod},\n${i2}) {\n${child}\n${indent}}`;
      }

      case 'none':
      default:
        return child || '';
    }
  },

  emitText(sem: SemanticIR & { role: 'text' }, cs: ComputedStyle, indent: string): string {
    const content = sem.content ?? '';
    const textProps = buildModifierForText(cs, indent);
    const mod = buildModifier(cs, indent);
    const propStr = textProps.length > 0
      ? `\n${indent}    ${textProps.join(`,\n${indent}    `)},\n`
      : '';
    const modStr = mod !== 'Modifier'
      ? `\n${indent}    modifier = ${mod},\n`
      : '';
    return `Text(\n${indent}    text = "${escapeCompose(content)}",${modStr}${propStr}\n${indent})`;
  },

  emitHeading(sem: SemanticIR & { role: 'heading' }, cs: ComputedStyle, indent: string): string {
    const content = sem.content ?? '';
    const level = sem.level ?? 2;
    const defaultSizes: Record<number, number> = { 1: 32, 2: 28, 3: 24, 4: 20, 5: 16, 6: 14 };
    const defaultWeights: Record<number, number> = { 1: 700, 2: 700, 3: 700, 4: 700, 5: 600, 6: 600 };

    const fontSize = cs.fontSize ?? defaultSizes[level];
    const fontWeight = cs.fontWeight ?? defaultWeights[level];
    const mod = buildModifier(cs, indent);

    const props: string[] = [
      `fontSize = ${fontSize}.sp`,
      `fontWeight = FontWeight.W${fontWeight}`,
    ];
    if (cs.color) props.push(`color = ${formatColor(cs.color)}`);

    const propStr = `\n${indent}    ${props.join(`,\n${indent}    `)},\n`;
    const modStr = mod !== 'Modifier'
      ? `\n${indent}    modifier = ${mod},\n`
      : '';
    return `Text(\n${indent}    text = "${escapeCompose(content)}",${modStr}${propStr}\n${indent})`;
  },

  emitButton(sem: SemanticIR & { role: 'button' }, cs: ComputedStyle, indent: string): string {
    const label = sem.label || 'Button';
    const mod = buildModifier(cs, indent);
    const modStr = mod !== 'Modifier'
      ? `\n${indent}    modifier = ${mod},`
      : '';

    const innerProps: string[] = [];
    if (cs.backgroundColor) {
      innerProps.push(`containerColor = ${formatColor(cs.backgroundColor)}`);
    }
    const innerStr = innerProps.length > 0
      ? `\n${indent}    ${innerProps.join(`,\n${indent}    `)},\n`
      : '';

    return `Button(\n${indent}    onClick = { }${modStr}${innerStr}\n${indent}) {\n${indent}    Text("${escapeCompose(label)}")\n${indent}}`;
  },

  emitLink(sem: SemanticIR & { role: 'link' }, cs: ComputedStyle, indent: string): string {
    const label = sem.label || sem.href || 'Link';
    const mod = buildModifier(cs, indent);
    const textProps = buildModifierForText(cs, indent);
    const propStr = textProps.length > 0
      ? `\n${indent}    ${textProps.join(`,\n${indent}    `)},\n`
      : '';
    const modStr = mod !== 'Modifier'
      ? `\n${indent}    modifier = ${mod},\n`
      : '';
    return `TextButton(\n${indent}    onClick = { }${modStr}\n${indent}) {\n${indent}    Text(\n${indent}        text = "${escapeCompose(label)}",${propStr}\n${indent}    )\n${indent}}`;
  },

  emitImage(sem: SemanticIR & { role: 'image' }, _cs: ComputedStyle, indent: string): string {
    const src = sem.source || '';
    const alt = sem.alt || '';
    const descStr = alt ? `,\n${indent}    contentDescription = "${escapeCompose(alt)}"` : '';

    if (src.startsWith('http://') || src.startsWith('https://')) {
      return `AsyncImage(\n${indent}    model = "${escapeCompose(src)}"${descStr},\n${indent})`;
    }
    return `Image(\n${indent}    painter = painterResource(id = R.drawable.${escapeCompose(src)})${descStr},\n${indent})`;
  },

  emitIcon(sem: SemanticIR & { role: 'icon' }, _cs: ComputedStyle, indent: string): string {
    return `Icon(\n${indent}    imageVector = Icons.Default.${capitalize(sem.name)},\n${indent}    contentDescription = null,\n${indent}    modifier = Modifier.size(${sem.size}.dp),\n${indent})`;
  },

  emitInput(sem: SemanticIR & { role: 'input' }, cs: ComputedStyle, indent: string): string {
    const mod = buildModifier(cs, indent);
    const placeholder = sem.placeholder
      ? `,\n${indent}    placeholder = { Text("${escapeCompose(sem.placeholder)}") }`
      : '';
    return `OutlinedTextField(\n${indent}    value = "",\n${indent}    onValueChange = { },${placeholder}\n${indent}    label = { Text("${escapeCompose(sem.name ?? 'Input')}") },\n${indent}    modifier = ${mod},\n${indent})`;
  },

  emitTextarea(sem: SemanticIR & { role: 'textarea' }, cs: ComputedStyle, indent: string): string {
    const mod = buildModifier(cs, indent);
    return `OutlinedTextField(\n${indent}    value = "",\n${indent}    onValueChange = { },\n${indent}    modifier = ${mod},\n${indent}    maxLines = ${sem.rows ?? 4},\n${indent})`;
  },

  emitSelect(_sem: SemanticIR & { role: 'select' }, cs: ComputedStyle, indent: string): string {
    const mod = buildModifier(cs, indent);
    return `ExposedDropdownMenuBox(\n${indent}    expanded = false,\n${indent}    onExpandedChange = { },\n${indent}    modifier = ${mod},\n${indent}) {\n${indent}    TextField(\n${indent}        value = "",\n${indent}        onValueChange = { },\n${indent}        readOnly = true,\n${indent}    )\n${indent}}`;
  },

  emitForm(_sem: SemanticIR & { role: 'form' }, cs: ComputedStyle, indent: string, children: string[]): string {
    const mod = buildModifier(cs, indent);
    if (children.length === 0) return `Column(modifier = ${mod}) {}`;
    return `Column(\n${indent}    modifier = ${mod},\n${indent}) {\n${children.join('\n')}\n${indent}}`;
  },

  emitList(_sem: SemanticIR & { role: 'list' }, cs: ComputedStyle, indent: string, children: string[]): string {
    const mod = buildModifier(cs, indent);
    if (children.length === 0) return `Column(modifier = ${mod}) {}`;
    return `Column(\n${indent}    modifier = ${mod},\n${indent}) {\n${children.join('\n')}\n${indent}}`;
  },

  emitListItem(sem: SemanticIR & { role: 'list-item' }, cs: ComputedStyle, indent: string): string {
    const mod = buildModifier(cs, indent);
    return `Text(\n${indent}    text = "${escapeCompose(sem.label)}",\n${indent}    modifier = ${mod},\n${indent})`;
  },

  emitDivider(_sem: SemanticIR & { role: 'divider' }, cs: ComputedStyle, indent: string): string {
    const mod = buildModifier(cs, indent);
    return `HorizontalDivider(\n${indent}    modifier = ${mod},\n${indent})`;
  },

  emitGeneric(_sem: SemanticIR & { role: 'generic' }, cs: ComputedStyle, indent: string, children: string[]): string {
    const mod = buildModifier(cs, indent);
    if (children.length === 0 && mod === 'Modifier') return '';
    if (children.length === 0) return `Box(modifier = ${mod})`;
    if (children.length === 1 && mod === 'Modifier') return children[0];
    return `Column(\n${indent}    modifier = ${mod},\n${indent}) {\n${children.join('\n')}\n${indent}}`;
  },

  emitUnknown(_sem: SemanticIR & { role: 'unknown' }, cs: ComputedStyle, indent: string, children: string[]): string {
    const mod = buildModifier(cs, indent);
    if (children.length === 0 && mod === 'Modifier') return '';
    if (children.length === 0) return `Box(modifier = ${mod})`;
    if (children.length === 1 && mod === 'Modifier') return children[0];
    return `Column(\n${indent}    modifier = ${mod},\n${indent}) {\n${children.join('\n')}\n${indent}}`;
  },
};

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function generateIr(node: IrNode, name: string = 'GeneratedView'): Result<GenerateResult> {
  const bag = new DiagnosticBag();
  const start = performance.now();

  const body = walkIrTree(node, composeIrEmitter, 0);
  const lines = body.split('\n');
  const indentedBody = lines
    .map((line, i) => i === 0 ? line : `    ${line}`)
    .join('\n');

  const code = `import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.graphics.Color
import coil.compose.AsyncImage

@Composable
fun ${name}() {
${indentedBody}
}
`;

  return bag.toResult({
    code,
    metadata: {
      platform: 'compose' as PlatformTarget,
      nodes: countIrNodes(node),
      duration: Math.round(performance.now() - start),
    },
  });
}
