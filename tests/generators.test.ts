import { describe, it, expect } from 'vitest';
import { parseHtml } from '../packages/parser/index.js';
import { parseCss, applyStyles } from '../packages/css-analyzer/index.js';
import { detectSemantics } from '../packages/semantic-analyzer/index.js';
import { styledNodeToIr } from '../packages/ir/index.js';
import { generate as generateFlutter } from '../packages/generators/flutter/index.js';
import { generate as generateCompose } from '../packages/generators/compose/index.js';
import { generate as generateSwiftUI } from '../packages/generators/swiftui/index.js';


function runPipeline(html: string, css: string = '') {
  const ast = parseHtml(html);
  const sheet = parseCss(css);
  const styled = applyStyles(ast.children, sheet);
  const hints = detectSemantics(styled);
  const root = { node: ast, styles: {}, children: styled };
  const ir = styledNodeToIr(root, hints);
  return ir;
}

const SAMPLE_HTML = `<div class="container">
  <h1>Hello World</h1>
  <button>Get Started</button>
</div>`;

const SAMPLE_CSS = `.container { padding: 16px; }
h1 { font-size: 24px; color: blue; }
button { background: blue; color: white; border-radius: 8px; }`;

describe('Generator boilerplate', () => {
  describe('Flutter', () => {
    it('wraps in StatelessWidget with material import', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      const result = generateFlutter(ir);
      expect(result.code).toContain("import 'package:flutter/material.dart'");
      expect(result.code).toContain('class GeneratedWidget extends StatelessWidget');
      expect(result.code).toContain('Widget build(BuildContext context)');
    });

    it('produces valid Dart widget structure', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      const result = generateFlutter(ir);
      expect(result.code).toContain('return');
      expect(result.code).toContain('Container');
      expect(result.code).toContain('Text("Hello World")');
      expect(result.code).toContain('ElevatedButton');
    });
  });

  describe('Compose', () => {
    it('wraps in @Composable function with Material3 imports', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      const result = generateCompose(ir);
      expect(result.code).toContain('import androidx.compose.material3.*');
      expect(result.code).toContain('import androidx.compose.runtime.*');
      expect(result.code).toContain('import androidx.compose.foundation.layout.*');
      expect(result.code).toContain('@Composable');
      expect(result.code).toContain('fun GeneratedComponent()');
    });

    it('produces valid Compose structure', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      const result = generateCompose(ir);
      expect(result.code).toContain('Text(text = "Hello World")');
      expect(result.code).toContain('Button(');
    });
  });

  describe('SwiftUI', () => {
    it('wraps in View struct with SwiftUI import', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      const result = generateSwiftUI(ir);
      expect(result.code).toContain('import SwiftUI');
      expect(result.code).toContain('struct GeneratedView: View');
      expect(result.code).toContain('var body: some View');
    });

    it('produces valid SwiftUI structure', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      const result = generateSwiftUI(ir);
      expect(result.code).toContain('Text("Hello World")');
      expect(result.code).toContain('Button("Get Started")');
    });
  });

  describe('Metadata', () => {
    it('reports correct platform target', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      expect(generateFlutter(ir).metadata.platform).toBe('flutter');
      expect(generateCompose(ir).metadata.platform).toBe('compose');
      expect(generateSwiftUI(ir).metadata.platform).toBe('swiftui');
    });

    it('reports node count', () => {
      const ir = runPipeline(SAMPLE_HTML, SAMPLE_CSS);
      expect(generateFlutter(ir).metadata.nodes).toBeGreaterThan(0);
      expect(generateCompose(ir).metadata.nodes).toBeGreaterThan(0);
      expect(generateSwiftUI(ir).metadata.nodes).toBeGreaterThan(0);
    });
  });
});
