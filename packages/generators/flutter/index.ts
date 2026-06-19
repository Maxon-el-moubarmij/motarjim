import { UiNode, GenerateResult, PlatformTarget } from '@html-native/shared';
import { optimize } from '@html-native/optimizer';

export function generate(node: UiNode): GenerateResult {
  const start = performance.now();
  const optimized = optimize(node);

  const code = generateNode(optimized, 0);

  return {
    code,
    metadata: {
      platform: 'flutter' as PlatformTarget,
      nodes: countNodes(optimized),
      duration: Math.round(performance.now() - start),
    },
  };
}

function getValue(node: UiNode): string {
  return node.value ?? (node.properties.value as string) ?? '';
}

function indent(level: number): string {
  return '  '.repeat(level);
}

function generateNode(node: UiNode, level: number): string {
  const i = indent(level);

  switch (node.type) {
    case 'Text': {
      const val = getValue(node);
      if (level === 0) return `${i}Text("${escapeDart(val)}")`;
      return `Text("${escapeDart(val)}")`;
    }

    case 'Button': {
      const childText = node.children.find(c => c.type === 'Text');
      const label = childText ? getValue(childText) : 'Button';
      const children = node.children.filter(c => c.type !== 'Text').map(c => generateNode(c, level + 1));
      const childBlock = children.length ? `\n${children.join('\n')}\n${i}` : '';
      return `ElevatedButton(\n${i}  onPressed: () {},\n${i}  child: ${childBlock || `Text("${escapeDart(label)}")`},\n${i})`;
    }

    case 'Row':
    case 'Column': {
      const isRow = node.type === 'Row';
      const widget = isRow ? 'Row' : 'Column';
      const children = node.children.map(c => generateNode(c, level + 1));
      if (children.length === 0) return `${widget}(\n${i}  children: [],\n${i})`;
      return `${widget}(\n${i}  children: [\n${children.join(',\n')},\n${i}  ],\n${i})`;
    }

    case 'Container': {
      const props = formatProps(node.properties, level);
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}Container(${props ? `\n${props}\n${i}` : ''})`;
      return `Container(\n${props ? `${props},\n` : ''}${i}  child: ${children[0]},\n${i})`;
    }

    case 'NavigationBar':
    case 'AppBar': {
      const title = node.children.find(c => c.type === 'Text');
      const titleStr = title ? getValue(title) : 'Title';
      return `AppBar(\n${i}  title: Text("${escapeDart(titleStr)}"),\n${i})`;
    }

    case 'Card': {
      const children = node.children.map(c => generateNode(c, level + 1));
      const child = children[0] || 'SizedBox.shrink()';
      return `Card(\n${i}  child: ${child},\n${i})`;
    }

    case 'Image': {
      const src = (node.properties.src as string) || '';
      return `Image.network("${escapeDart(src)}")`;
    }

    case 'TextField': {
      return `TextField(\n${i}  decoration: InputDecoration(\n${i}    border: OutlineInputBorder(),\n${i}  ),\n${i})`;
    }

    case 'ListView':
    case 'LazyList':
    case 'ScrollView': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `ListView(\n${i}  children: [],\n${i})`;
      return `ListView(\n${i}  children: [\n${children.join(',\n')},\n${i}  ],\n${i})`;
    }

    case 'Form': {
      const children = node.children.map(c => generateNode(c, level + 1));
      return `Form(\n${i}  child: Column(\n${i}    children: [\n${children.join(',\n')},\n${i}    ],\n${i}  ),\n${i})`;
    }

    case 'Footer': {
      const children = node.children.map(c => generateNode(c, level + 1));
      return `Container(\n${i}  child: Column(\n${i}    children: [\n${children.join(',\n')},\n${i}    ],\n${i}  ),\n${i})`;
    }

    default: {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) {
        if (getValue(node)) {
          return `Text("${escapeDart(getValue(node))}")`;
        }
        return 'SizedBox.shrink()';
      }
      return `Column(\n${i}  children: [\n${children.join(',\n')},\n${i}  ],\n${i})`;
    }
  }
}

function formatProps(props: Record<string, unknown>, level: number): string {
  const lines: string[] = [];
  const i = indent(level + 1);
  for (const [key, val] of Object.entries(props)) {
    if (key === 'value') continue;
    lines.push(`${i}${camelToSnake(key)}: ${formatValue(val)}`);
  }
  return lines.join(',\n');
}

function formatValue(val: unknown): string {
  if (typeof val === 'string') {
    if (val.match(/^\d+px$/)) return String(parseInt(val));
    if (val.match(/^\d+$/)) return val;
    return `"${escapeDart(val)}"`;
  }
  return String(val);
}

function escapeDart(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\$/g, '\\$');
}

function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
}

function countNodes(node: UiNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

export { generateNode as generateFlutterNode };
