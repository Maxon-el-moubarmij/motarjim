// packages/pipeline-core/index.ts

import { parseHtml } from '@motarjim/parser';
import { parseCss, applyStyles, analyzeLayoutIntents, buildResponsiveMetadata } from '@motarjim/css-analyzer';
import { detectSemantics } from '@motarjim/semantic-analyzer';
import { styledNodeToIr, enrichWithIntentSync } from '@motarjim/ir';
import { optimize } from '@motarjim/optimizer';
import { generate as generateFlutter } from '@motarjim/generator-flutter';
import { generate as generateCompose } from '@motarjim/generator-compose';
import { generate as generateSwiftUI } from '@motarjim/generator-swiftui';
import type { HtmlNode, StyledNode, UiNode, GenerateResult, Result } from '@motarjim/shared';

export type Target = 'flutter' | 'compose' | 'swiftui';

export interface PipelineInput {
  html: string;
  css: string;
  target: Target;
}

export interface PipelineStats {
  htmlNodes: number;
  componentsDetected: number;
  generatedLines: number;
  target: Target;
  duration: number;
}

export interface PipelineResult {
  code: string;
  stats: PipelineStats;
}

/** Same unwrap pattern as the CLI's `requireOk` in packages/cli/src/services/pipeline.ts */
function requireOk<T>(result: Result<T>, phase: string): T {
  if (!result.ok) {
    const message = result.diagnostics.map((d) => d.message).join('; ');
    throw new Error(`${phase} failed: ${message}`);
  }
  return result.value;
}

const COMPONENT_TYPES = new Set([
  'Button', 'Card', 'NavigationBar', 'AppBar', 'Drawer',
  'HeroSection', 'Footer', 'Sidebar', 'Dialog', 'Modal',
  'Tabs', 'Form', 'TextField', 'TextArea', 'List',
]);

function countHtmlNodes(node: HtmlNode): number {
  let count = 1;
  for (const child of node.children) count += countHtmlNodes(child);
  return count;
}

function countComponentNodes(node: UiNode): number {
  let count = COMPONENT_TYPES.has(node.type) ? 1 : 0;
  for (const child of node.children) count += countComponentNodes(child);
  return count;
}

/**
 * Mirrors the private `attachResponsiveMetadata` in
 * packages/cli/src/services/pipeline.ts — not exported from @motarjim/ir,
 * so it's duplicated here the same way the CLI duplicates it locally.
 */
function attachResponsiveMetadata(ir: UiNode, metadata: unknown): UiNode {
  function walk(node: UiNode): UiNode {
    return {
      ...node,
      responsiveMetadata: metadata,
      children: node.children.map(walk),
    };
  }
  return walk(ir);
}

/**
 * Runs the full motarjim pipeline on in-memory HTML/CSS and returns
 * generated native code + stats. Shared by the CLI and the Web server.
 *
 * Deliberately leaves out two things the CLI's runPipeline has:
 *  - Accessibility analysis (@motarjim/accessibility-analyzer)
 *  - AI-enhanced semantic detection (options.aiEnhance)
 * Web doesn't accept either input yet. If/when it does, those stages
 * slot in here exactly like they do in packages/cli/src/services/pipeline.ts.
 */
export function runPipeline(input: PipelineInput): PipelineResult {
  const { html, css, target } = input;
  const startTime = Date.now();

  const ast = requireOk(parseHtml(html), 'parser');
  const htmlNodes = countHtmlNodes(ast);

  const stylesheet = requireOk(parseCss(css || ''), 'css');

  let styledNodes: StyledNode[] = requireOk(applyStyles(ast.children, stylesheet), 'css');
  styledNodes = analyzeLayoutIntents(styledNodes);

  const responsiveMetadata = buildResponsiveMetadata(stylesheet);

  const hints = requireOk(detectSemantics(styledNodes), 'semantic');

  const rootStyled: StyledNode = {
    node: ast,
    styles: {},
    children: styledNodes,
    layoutIntent: { type: 'Stack', properties: {}, confidence: 1 },
  };

  let ir = requireOk(styledNodeToIr(rootStyled, hints), 'ir');

  if (responsiveMetadata.breakpoints.length > 0) {
    ir = attachResponsiveMetadata(ir, responsiveMetadata);
  }

  ir = enrichWithIntentSync(ir);

  const componentsDetected = countComponentNodes(ir);
  const optimized = requireOk(optimize(ir), 'optimizer');

  let result: GenerateResult;
  switch (target) {
    case 'flutter':
      result = requireOk(generateFlutter(optimized), 'generator');
      break;
    case 'compose':
      result = requireOk(generateCompose(optimized), 'generator');
      break;
    case 'swiftui':
      result = requireOk(generateSwiftUI(optimized), 'generator');
      break;
    default:
      throw new Error(`Unknown target "${target}"`);
  }

  const duration = (Date.now() - startTime) / 1000;

  return {
    code: result.code,
    stats: {
      htmlNodes,
      componentsDetected,
      generatedLines: result.code.split('\n').length,
      target,
      duration,
    },
  };
}