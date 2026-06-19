import { UiNode, GenerateResult, PlatformTarget } from '@html-native/shared';
import { optimize } from '@html-native/optimizer';

// Compose generator: wraps composable trees in a @Composable function with Material3 imports.
export function generate(node: UiNode): GenerateResult {
  const start = performance.now();
  const optimized = optimize(node);

  const body = generateNode(optimized, 0);
  const indentedBody = body
    .split('\n')
    .map(line => `    ${line}`)
    .join('\n');

  const code = `import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Modifier

@Composable
fun GeneratedComponent() {
${indentedBody}
}
`;

  return {
    code,
    metadata: {
      platform: 'compose' as PlatformTarget,
      nodes: countNodes(optimized),
      duration: Math.round(performance.now() - start),
    },
  };
}

function getValue(node: UiNode): string {
  return node.value ?? (node.properties.value as string) ?? '';
}

function indent(level: number): string {
  return '    '.repeat(level);
}

function generateNode(node: UiNode, level: number): string {
  const i = indent(level);

  switch (node.type) {
    case 'Text': {
      const val = getValue(node);
      return `${i}Text(text = "${escapeKotlin(val)}")`;
    }

    case 'Button': {
      const childText = node.children.find(c => c.type === 'Text');
      const label = childText ? getValue(childText) : 'Button';
      const children = node.children.filter(c => c.type !== 'Text').map(c => generateNode(c, level + 1));
      const onClick = 'onClick = { }';
      const content = children.length
        ? children.join('\n')
        : `${indent(level + 1)}Text(text = "${escapeKotlin(label)}")`;
      return `${i}Button(\n${i}    ${onClick}\n${i}) {\n${content}\n${i}}`;
    }

    case 'Row': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}Row {}`;
      return `${i}Row(\n${i}    horizontalArrangement = Arrangement.spacedBy(8.dp)\n${i}) {\n${children.join('\n')}\n${i}}`;
    }

    case 'Column': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}Column {}`;
      return `${i}Column {\n${children.join('\n')}\n${i}}`;
    }

    case 'Container': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}Box(modifier = Modifier)`;
      return `${i}Box(modifier = Modifier) {\n${children.join('\n')}\n${i}}`;
    }

    case 'Card': {
      const children = node.children.map(c => generateNode(c, level + 1));
      const child = children[0] || '';
      return `${i}Card(\n${i}    modifier = Modifier\n${i}) {\n${child}\n${i}}`;
    }

    case 'Image': {
      const src = (node.properties.src as string) || '';
      return `${i}Image(\n${i}    painter = painterResource(id = R.drawable.${escapeKotlin(src)}),\n${i}    contentDescription = "${escapeKotlin((node.properties.alt as string) || '')}"\n${i})`;
    }

    case 'TextField': {
      return `${i}OutlinedTextField(\n${i}    value = "",\n${i}    onValueChange = { },\n${i}    label = { Text("Input") }\n${i})`;
    }

    case 'NavigationBar':
    case 'AppBar': {
      const title = node.children.find(c => c.type === 'Text');
      const titleStr = title ? getValue(title) : 'Title';
      return `${i}TopAppBar(\n${i}    title = { Text("${escapeKotlin(titleStr)}") }\n${i})`;
    }

    case 'ScrollView':
    case 'LazyList':
    case 'ListView': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}LazyColumn {}`;
      return `${i}LazyColumn {\n${children.join('\n')}\n${i}}`;
    }

    case 'Form': {
      const children = node.children.map(c => generateNode(c, level + 1));
      return `${i}Column {\n${children.join('\n')}\n${i}}`;
    }

    default: {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) {
        if (getValue(node)) {
          return `${i}Text(text = "${escapeKotlin(getValue(node))}")`;
        }
        return `${i}Spacer(modifier = Modifier.size(0.dp))`;
      }
      return `${i}Column {\n${children.join('\n')}\n${i}}`;
    }
  }
}

function escapeKotlin(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function countNodes(node: UiNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

export { generateNode as generateComposeNode };
