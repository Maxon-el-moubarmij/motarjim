import { UiNode, GenerateResult, PlatformTarget } from '@html-native/shared';
import { optimize } from '@html-native/optimizer';

export function generate(node: UiNode): GenerateResult {
  const start = performance.now();
  const optimized = optimize(node);

  const code = generateNode(optimized, 0);

  return {
    code,
    metadata: {
      platform: 'swiftui' as PlatformTarget,
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
      return `${i}Text("${escapeSwift(val)}")`;
    }

    case 'Button': {
      const childText = node.children.find(c => c.type === 'Text');
      const label = childText ? getValue(childText) : 'Button';
      const action = `${i}    // action`;
      return `${i}Button("${escapeSwift(label)}") {\n${action}\n${i}}`;
    }

    case 'Row': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}HStack {}`;
      return `${i}HStack {\n${children.join('\n')}\n${i}}`;
    }

    case 'Column': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}VStack {}`;
      return `${i}VStack {\n${children.join('\n')}\n${i}}`;
    }

    case 'Container': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}Color.clear`;
      return `${i}VStack {\n${children.join('\n')}\n${i}}`;
    }

    case 'Card': {
      const children = node.children.map(c => generateNode(c, level + 1));
      const child = children[0] || '';
      return `${i}VStack {\n${child}\n${i}}\n${i}.background(Color(.systemBackground))\n${i}.cornerRadius(12)\n${i}.shadow(radius: 4)`;
    }

    case 'Image': {
      const src = (node.properties.src as string) || '';
      return `${i}Image("${escapeSwift(src)}")\n${i}.resizable()\n${i}.aspectRatio(contentMode: .fit)`;
    }

    case 'TextField': {
      return `${i}TextField("Input", text: .constant(""))\n${i}.textFieldStyle(.roundedBorder)`;
    }

    case 'NavigationBar':
    case 'AppBar': {
      const title = node.children.find(c => c.type === 'Text');
      const titleStr = title ? getValue(title) : 'Title';
      return `${i}.navigationTitle("${escapeSwift(titleStr)}")`;
    }

    case 'ScrollView':
    case 'LazyList':
    case 'ListView': {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) return `${i}ScrollView {}`;
      return `${i}ScrollView {\n${i}    LazyVStack {\n${children.join('\n')}\n${i}    }\n${i}}`;
    }

    case 'Form': {
      const children = node.children.map(c => generateNode(c, level + 1));
      return `${i}Form {\n${children.join('\n')}\n${i}}`;
    }

    default: {
      const children = node.children.map(c => generateNode(c, level + 1));
      if (!children.length) {
        if (getValue(node)) {
          return `${i}Text("${escapeSwift(getValue(node))}")`;
        }
        return `${i}Spacer()`;
      }
      return `${i}VStack {\n${children.join('\n')}\n${i}}`;
    }
  }
}

function escapeSwift(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function countNodes(node: UiNode): number {
  let count = 1;
  for (const child of node.children) {
    count += countNodes(child);
  }
  return count;
}

export { generateNode as generateSwiftUINode };
