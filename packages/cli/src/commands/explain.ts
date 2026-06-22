import type { PipelineStage } from '../types.js';

const STAGES: PipelineStage[] = [
  {
    name: 'HTML Parsing',
    package: '@motarjim/parser',
    description: 'Parses HTML input using parse5 into an HtmlNode AST. Only <body> content is retained.',
  },
  {
    name: 'CSS Analysis',
    package: '@motarjim/css-analyzer',
    description: 'Parses CSS with PostCSS, matches selectors (tag, class, id, universal) to HTML nodes, and attaches resolved styles.',
  },
  {
    name: 'Semantic Analysis',
    package: '@motarjim/semantic-analyzer',
    description: 'Detects UI components (navbars, cards, heroes, modals) using rule-based heuristics. Optional Ollama AI enhancement.',
  },
  {
    name: 'IR Conversion',
    package: '@motarjim/ir',
    description: 'Converts styled nodes into a platform-neutral intermediate representation (UiNode tree, 38 node types). CSS properties are normalized to camelCase.',
  },
  {
    name: 'Optimization',
    package: '@motarjim/optimizer',
    description: 'Runs three passes: remove empty text nodes, merge adjacent text nodes, flatten redundant container wrappers.',
  },
  {
    name: 'Code Generation',
    package: '@motarjim/generator-{flutter,compose,swiftui}',
    description: 'Walks the optimized IR tree and emits platform-specific code (Dart, Kotlin, or Swift) using the generator-core traversal engine.',
  },
];

export async function explainCommand(): Promise<void> {
  const W = 16;

  console.log();
  console.log('HTML-Native Compilation Pipeline');
  console.log('='.repeat(50));
  console.log();
  console.log('Input: HTML + CSS');
  console.log();

  for (let i = 0; i < STAGES.length; i++) {
    const stage = STAGES[i];

    if (i > 0) {
      console.log(`${' '.repeat(W / 2)}│`);
      console.log(`${' '.repeat(W / 2)}▼`);
    }

    const label = stage.name.padEnd(W);
    console.log(`${'─'.repeat(W + 2)}`);
    console.log(`  ${label}  │  ${stage.description}`);
    console.log(`${'─'.repeat(W + 2)}`);
    console.log(`  Package: ${stage.package}`);
  }

  console.log();
  console.log('='.repeat(50));
  console.log('Output: Flutter (Dart) | Jetpack Compose (Kotlin) | SwiftUI (Swift)');
  console.log();
}
